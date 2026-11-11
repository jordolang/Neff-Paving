import XCTest
@testable import NeffPaving

final class ModelDecodingTests: XCTestCase {
    private func decode<T: Decodable>(_ type: T.Type, _ json: String) throws -> T {
        try APIClient.decode(T.self, from: Data(json.utf8))
    }

    func testUserEnvelopeDecodes() throws {
        let user = try decode(User.self, """
        { "data": {
          "id": 7, "email": "a@b.com", "firstName": "Ann", "lastName": "Lee", "phone": "740-555-0100",
          "avatarUrl": null, "address": { "line1": "1 Main", "line2": "", "city": "Zanesville", "state": "OH", "zip": "43701" },
          "role": "crew_lead", "isInternal": true, "permissions": ["time.clock", "jobs.status_update", "made.up"],
          "company": { "key": "neff", "name": "Neff Paving", "primaryColor": "#F5A400" },
          "notificationPrefs": { "push": true, "email": false, "sms": false },
          "publicProfile": false, "createdAt": "2026-11-11T17:58:00.123Z", "someNewField": 1 } }
        """)
        XCTAssertEqual(user.role, .crewLead)
        XCTAssertEqual(user.fullName, "Ann Lee")
        XCTAssertEqual(user.address?.formatted, "1 Main, Zanesville, OH 43701")
        XCTAssertTrue(user.permissionSet.has(.timeClock))
        XCTAssertFalse(user.permissionSet.has(.usersManage))
        XCTAssertEqual(user.notificationPrefs?.email, false)
        XCTAssertNotNil(user.createdAt)
    }

    func testJobWithMoneyAndDates() throws {
        let jobs = try decode([Job].self, """
        { "data": [{ "id": 12, "title": "Driveway reseal", "status": "in_progress",
          "serviceAddress": { "line1": "5 Elm", "city": "Zanesville", "state": "OH", "zip": "43701" },
          "latitude": 39.94, "longitude": -82.01,
          "customer": { "id": 3, "name": "Jo Smith", "phone": "740", "email": "jo@x.com" },
          "crew": null, "scheduledStart": "2026-11-12T13:00:00Z", "scheduledEnd": null, "completedAt": null,
          "estimateTotal": "4200.00", "progress": 40, "coverPhotoUrl": null, "sharedPublicly": true,
          "createdAt": "2026-11-01T10:00:00Z" }], "meta": { "total": 1 } }
        """)
        XCTAssertEqual(jobs.count, 1)
        XCTAssertEqual(jobs[0].status, .inProgress)
        XCTAssertEqual(jobs[0].estimateTotal?.value, Decimal(string: "4200"))
        XCTAssertEqual(jobs[0].sharedPublicly, true)
        XCTAssertTrue(jobs[0].hasCoordinate)
    }

    func testUnknownEnumValuesFallBack() throws {
        let job = try decode(Job.self, #"{ "id": 1, "title": "x", "status": "teleported" }"#)
        XCTAssertEqual(job.status, .lead)
        let role = try JSON.decoder.decode([Role].self, from: Data(#"["janitor", "admin"]"#.utf8))
        XCTAssertEqual(role, [.customer, .admin])
    }

    func testEstimateLineItemsAndDayDates() throws {
        let estimate = try decode(Estimate.self, """
        { "id": 9, "customerId": 3, "status": "sent", "serviceType": "Sealcoating",
          "lineItems": [{ "description": "Seal", "quantity": "2", "unitPrice": "100.50", "total": "201.00" }],
          "total": "201.00", "validUntil": "2026-12-31", "preferredDate": "2026-12-01" }
        """)
        XCTAssertEqual(estimate.status, .sent)
        XCTAssertEqual(estimate.lineItems?.first?.computedTotal.moneyString, "201.00")
        let comps = Calendar.current.dateComponents([.year, .month, .day], from: estimate.validUntil!)
        XCTAssertEqual(comps.year, 2026); XCTAssertEqual(comps.month, 12); XCTAssertEqual(comps.day, 31)
    }

    func testTimeStatusAndLiveLocation() throws {
        let status = try decode(TimeStatus.self, """
        { "data": { "clockedIn": true, "trackingRequired": true, "pingIntervalSeconds": 60,
          "entry": { "id": 30, "userId": 7, "jobId": 12, "clockIn": "2026-11-11T12:00:00Z", "clockOut": null,
                     "hours": null, "status": "open", "clockInLat": 39.9, "clockInLng": -82.0, "notes": "" } } }
        """)
        XCTAssertTrue(status.clockedIn)
        XCTAssertEqual(status.entry?.jobId, 12)
        XCTAssertEqual(status.pingIntervalSeconds, 60)

        let live = try decode([LiveLocation].self, """
        [{ "userId": 7, "name": "Ann Lee", "role": "crew_lead", "latitude": 39.94, "longitude": -82.01,
           "accuracy": 8.0, "speed": 0.0, "heading": 90.0, "batteryLevel": 0.82,
           "recordedAt": "2026-11-11T17:58:00Z", "clockedInAt": "2026-11-11T12:00:00Z",
           "currentJob": { "id": 12, "title": "Driveway" } }]
        """)
        XCTAssertEqual(live.first?.id, 7)
    }

    func testPersonRefToleratesBlankRoleAndNullSender() throws {
        let update = try decode(StatusUpdate.self, """
        { "id": 1, "jobId": 12, "status": "completed", "message": "Done", "media": [],
          "author": { "id": 7, "name": "Ann", "role": "" }, "visibleToCustomer": true, "createdAt": "2026-11-11T17:58:00.000Z" }
        """)
        XCTAssertNil(update.author?.role)
        let message = try decode(Message.self, #"{ "id": 1, "threadId": 4, "sender": null, "body": "hi", "createdAt": null }"#)
        XCTAssertNil(message.sender)
    }

    func testCompanyAddressAsStringOrObject() throws {
        let a = try decode(CompanyProfile.self, #"{ "key": "neff", "name": "Neff Paving", "address": "1 Rd, Zanesville" }"#)
        XCTAssertEqual(a.addressText, "1 Rd, Zanesville")
        let b = try decode(CompanyProfile.self, #"{ "key": "neff", "name": "Neff", "address": { "line1": "1 Rd", "city": "Z", "state": "OH", "zip": "1" } }"#)
        XCTAssertEqual(b.addressText, "1 Rd, Z, OH 1")
    }

    func testErrorEnvelopeMapping() {
        let body = Data(#"{ "error": { "code": "not_clocked_in", "message": "Clock in first" } }"#.utf8)
        XCTAssertThrowsError(try APIClient.check(body, status: 409)) { error in
            guard let api = error as? APIError else { return XCTFail("wrong error") }
            XCTAssertTrue(api.isNotClockedIn)
            XCTAssertEqual(api.localizedDescription, "Clock in first")
            XCTAssertFalse(api.isTransient)
        }
        XCTAssertThrowsError(try APIClient.check(Data(), status: 503)) { error in
            XCTAssertTrue((error as? APIError)?.isTransient == true)
        }
        XCTAssertThrowsError(try APIClient.check(Data(#"{"error":{"code":"rate_limited","message":"Slow down"}}"#.utf8), status: 429)) { error in
            XCTAssertTrue((error as? APIError)?.isTransient == true)
        }
    }

    func testURLBuildingAndCompanyHeaderConfig() throws {
        let config = AppConfig(company: .austin, apiBaseURL: URL(string: "https://api.example.com/api/v1")!,
                               googleClientID: nil, displayName: "Austin Trucking")
        let client = APIClient(config: config, tokenStore: InMemoryTokenStore())
        let url = try client.makeURL("/jobs", query: ["status": "scheduled", "mine": "1", "skip": nil])
        XCTAssertEqual(url.absoluteString, "https://api.example.com/api/v1/jobs?mine=1&status=scheduled")
        XCTAssertFalse(client.isAuthenticated)
    }

    func testJSONValueRequestBodies() throws {
        let body: JSONValue = ["a": .optional(nil as String?), "b": .day(DateFormats.parse("2026-12-24")), "c": [1, true, "x"]]
        let data = try JSON.encoder.encode(body)
        let back = try JSON.decoder.decode(JSONValue.self, from: data)
        XCTAssertEqual(back["a"], .null)
        XCTAssertEqual(back["b"], .string("2026-12-24"))
        XCTAssertEqual(back["c"], .array([.int(1), .bool(true), .string("x")]))
    }
}
