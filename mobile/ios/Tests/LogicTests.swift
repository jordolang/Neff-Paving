import XCTest
@testable import NeffPaving

final class PermissionTests: XCTestCase {
    func testPermissionSetChecks() {
        let set = PermissionSet(["jobs.view_assigned", "time.clock", "unknown.thing"])
        XCTAssertTrue(set.has(.timeClock))
        XCTAssertTrue(set.canSeeJobs)
        XCTAssertFalse(set.isAdminArea)
        XCTAssertTrue(set.hasAny(.usersManage, .timeClock))
        XCTAssertTrue(PermissionSet(["tracking.view_live"]).isAdminArea)
    }

    func testOnlySuperAdminManagesAdmins() {
        XCTAssertTrue(Role.assignable(by: .superAdmin).contains(.admin))
        XCTAssertFalse(Role.assignable(by: .admin).contains(.admin))
        XCTAssertFalse(Role.assignable(by: .admin).contains(.superAdmin))
        XCTAssertTrue(Role.assignable(by: .admin).contains(.employee))
        XCTAssertEqual(Role.assignable(by: .officeStaff), [])

        XCTAssertTrue(Role.canModify(target: .admin, actor: .superAdmin))
        XCTAssertFalse(Role.canModify(target: .admin, actor: .admin))
        XCTAssertFalse(Role.canModify(target: .superAdmin, actor: .admin))
        XCTAssertTrue(Role.canModify(target: .customer, actor: .admin))
        XCTAssertFalse(Role.canModify(target: .customer, actor: .crewLead))
    }

    func testRoleRankingAndInternal() {
        XCTAssertLessThan(Role.superAdmin.rank, Role.admin.rank)
        XCTAssertLessThan(Role.officeStaff.rank, Role.crewLead.rank)
        XCTAssertFalse(Role.customer.isInternal)
        XCTAssertTrue(Role.mechanic.isInternal)
    }

    func testEveryContractPermissionIsKnown() {
        XCTAssertEqual(Permission.allCases.count, Set(Permission.allCases.map(\.rawValue)).count)
        XCTAssertNotNil(Permission(rawValue: "job_postings.manage"))
        XCTAssertNotNil(Permission(rawValue: "tracking.view_live"))
    }
}

final class MoneyTests: XCTestCase {
    func testParsingAndFormatting() throws {
        XCTAssertEqual(DecimalString(string: "$1,250.5")?.currency, "$1,250.50")
        XCTAssertEqual(DecimalString(string: "7.5")?.twoDecimals, "7.50")
        XCTAssertNil(DecimalString(string: "abc"))
        XCTAssertNil(DecimalString(string: ""))
        XCTAssertEqual(([DecimalString("0.10"), "0.20"] as [DecimalString]).sum.moneyString, "0.30") // no float drift
    }

    func testDecodesStringOrNumberAndEncodesString() throws {
        let values = try JSON.decoder.decode([DecimalString].self, from: Data(#"["1250.00", 12.5]"#.utf8))
        XCTAssertEqual(values[0].currency, "$1,250.00")
        XCTAssertEqual(values[1].moneyString, "12.50")
        let encoded = String(data: try JSON.encoder.encode(DecimalString("19.99")), encoding: .utf8)
        XCTAssertEqual(encoded, #""19.99""#)
    }

    func testLineItemTotals() {
        let item = LineItem(description: "Seal", quantity: "3", unitPrice: "33.33")
        XCTAssertEqual(item.computedTotal.moneyString, "99.99")
        XCTAssertEqual(item.json["total"], .string("99.99"))
    }
}

final class LocationQueueTests: XCTestCase {
    private func point(_ lat: Double, _ lng: Double, _ t: TimeInterval = 0) -> LocationPoint {
        LocationPoint(latitude: lat, longitude: lng, accuracy: 5, speed: nil, heading: nil, batteryLevel: 0.5,
                      recordedAt: Date(timeIntervalSince1970: 1_800_000_000 + t))
    }

    func testPersistsAcrossInstances() throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("lq-\(UUID().uuidString).json")
        defer { try? FileManager.default.removeItem(at: url) }
        let queue = LocationQueue(fileURL: url)
        queue.append(point(39.9, -82.0))
        queue.append(point(39.91, -82.0, 60))
        let reloaded = LocationQueue(fileURL: url)
        XCTAssertEqual(reloaded.count, 2)
        XCTAssertEqual(reloaded.peek(max: 1).first, point(39.9, -82.0))
        reloaded.removeFirst(1)
        XCTAssertEqual(LocationQueue(fileURL: url).count, 1)
        reloaded.clear()
        XCTAssertEqual(LocationQueue(fileURL: url).count, 0)
    }

    func testCapsStoredPoints() {
        let queue = LocationQueue(fileURL: nil)
        for i in 0..<(LocationQueue.maxStoredPoints + 10) { queue.append(point(39, -82, TimeInterval(i))) }
        XCTAssertEqual(queue.count, LocationQueue.maxStoredPoints)
        XCTAssertEqual(queue.peek(max: 1).first?.recordedAt, Date(timeIntervalSince1970: 1_800_000_010))
    }

    func testDistance() {
        // ~111 m per 0.001° latitude
        let d = point(39.000, -82).distance(to: point(39.001, -82))
        XCTAssertEqual(d, 111, accuracy: 2)
    }

    func testFlushPolicyIntervalAndDistance() {
        let policy = FlushPolicy(interval: 60, distance: 50)
        let now = Date()
        let base = point(39.0, -82.0)
        XCTAssertFalse(policy.shouldFlush(now: now, lastFlushAt: nil, lastFlushedPoint: nil, latest: base, pending: 0))
        XCTAssertTrue(policy.shouldFlush(now: now, lastFlushAt: nil, lastFlushedPoint: nil, latest: base, pending: 1))
        // 30 s later, barely moved → wait
        XCTAssertFalse(policy.shouldFlush(now: now, lastFlushAt: now.addingTimeInterval(-30), lastFlushedPoint: base,
                                          latest: point(39.0001, -82.0), pending: 3))
        // 30 s later, moved ~111 m → flush
        XCTAssertTrue(policy.shouldFlush(now: now, lastFlushAt: now.addingTimeInterval(-30), lastFlushedPoint: base,
                                         latest: point(39.001, -82.0), pending: 3))
        // 61 s later, not moved → flush
        XCTAssertTrue(policy.shouldFlush(now: now, lastFlushAt: now.addingTimeInterval(-61), lastFlushedPoint: base,
                                         latest: base, pending: 1))
    }

    func testPointJSONMatchesContract() {
        let json = point(39.9, -82.0).json
        XCTAssertEqual(json["latitude"], .number(39.9))
        XCTAssertEqual(json["speed"], .null)
        XCTAssertNotNil(json["recordedAt"]?.stringValue)
    }
}
