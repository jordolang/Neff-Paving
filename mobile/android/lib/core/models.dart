import 'json.dart';
import 'money.dart';
import 'permissions.dart';

/// Models for every shape in mobile/API_CONTRACT.md.

class Address {
  const Address({this.line1 = '', this.line2 = '', this.city = '', this.state = '', this.zip = ''});

  factory Address.fromJson(Json j) => Address(
        line1: asString(j['line1']),
        line2: asString(j['line2']),
        city: asString(j['city']),
        state: asString(j['state']),
        zip: asString(j['zip']),
      );

  final String line1, line2, city, state, zip;

  bool get isEmpty => line1.isEmpty && city.isEmpty && zip.isEmpty;

  /// One line, suitable for maps search: "12 Main St, Zanesville, OH 43701".
  String get singleLine => [
        [line1, line2].where((s) => s.isNotEmpty).join(' '),
        city,
        [state, zip].where((s) => s.isNotEmpty).join(' '),
      ].where((s) => s.isNotEmpty).join(', ');

  Json toJson() => {'line1': line1, 'line2': line2, 'city': city, 'state': state, 'zip': zip};
}

/// A compact reference to a person: `{ id, name, role? }`.
class PersonRef {
  const PersonRef({required this.id, required this.name, this.role, this.phone, this.email});

  factory PersonRef.fromJson(Json j) => PersonRef(
        id: asInt(j['id']),
        name: asString(j['name']),
        role: asStringOrNull(j['role']),
        phone: asStringOrNull(j['phone']),
        email: asStringOrNull(j['email']),
      );

  static PersonRef? maybe(Object? v) => v is Map ? PersonRef.fromJson(asMap(v)) : null;

  final int id;
  final String name;
  final String? role, phone, email;
}

class CompanyInfo {
  const CompanyInfo({
    required this.key,
    required this.name,
    this.primaryColor,
    this.phone,
    this.email,
    this.address,
    this.website,
  });

  factory CompanyInfo.fromJson(Json j) => CompanyInfo(
        key: asString(j['key']),
        name: asString(j['name']),
        primaryColor: asStringOrNull(j['primaryColor']),
        phone: asStringOrNull(j['phone']),
        email: asStringOrNull(j['email']),
        address: j['address'] is Map ? Address.fromJson(asMap(j['address'])) : null,
        website: asStringOrNull(j['website']),
      );

  final String key, name;
  final String? primaryColor, phone, email, website;
  final Address? address;
}

class NotificationPrefs {
  const NotificationPrefs({this.push = true, this.email = true, this.sms = false});

  factory NotificationPrefs.fromJson(Json j) => NotificationPrefs(
        push: asBool(j['push'], true),
        email: asBool(j['email'], true),
        sms: asBool(j['sms']),
      );

  final bool push, email, sms;

  Json toJson() => {'push': push, 'email': email, 'sms': sms};
}

class User {
  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.avatarUrl,
    this.address = const Address(),
    required this.role,
    required this.isInternal,
    required this.permissions,
    this.company,
    this.notificationPrefs = const NotificationPrefs(),
    this.publicProfile = false,
    this.createdAt,
    this.active = true,
  });

  factory User.fromJson(Json j) => User(
        id: asInt(j['id']),
        email: asString(j['email']),
        firstName: asString(j['firstName']),
        lastName: asString(j['lastName']),
        phone: asStringOrNull(j['phone']),
        avatarUrl: asStringOrNull(j['avatarUrl']),
        address: Address.fromJson(asMap(j['address'])),
        role: Role.fromKey(asStringOrNull(j['role'])),
        isInternal: asBool(j['isInternal'], Role.fromKey(asStringOrNull(j['role'])).isInternal),
        permissions: asStringList(j['permissions']).toSet(),
        company: j['company'] is Map ? CompanyInfo.fromJson(asMap(j['company'])) : null,
        notificationPrefs: NotificationPrefs.fromJson(asMap(j['notificationPrefs'])),
        publicProfile: asBool(j['publicProfile']),
        createdAt: asDate(j['createdAt']),
        active: asBool(j['active'] ?? j['isActive'], true),
      );

  final int id;
  final String email, firstName, lastName;
  final String? phone, avatarUrl;
  final Address address;
  final Role role;
  final bool isInternal;
  final Set<String> permissions;
  final CompanyInfo? company;
  final NotificationPrefs notificationPrefs;
  final bool publicProfile;
  final DateTime? createdAt;
  final bool active;

  String get fullName => '$firstName $lastName'.trim();
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

  bool can(String permission) => permissions.contains(permission);
  bool canAny(Iterable<String> perms) => perms.any(permissions.contains);
}

class AuthResult {
  const AuthResult({required this.accessToken, required this.refreshToken, required this.user});

  factory AuthResult.fromJson(Json j) => AuthResult(
        accessToken: asString(j['accessToken']),
        refreshToken: asString(j['refreshToken']),
        user: User.fromJson(asMap(j['user'])),
      );

  final String accessToken, refreshToken;
  final User user;
}

enum JobStatus {
  lead('Lead'),
  estimating('Estimating'),
  scheduled('Scheduled'),
  inProgress('In progress'),
  onHold('On hold'),
  completed('Completed'),
  cancelled('Cancelled');

  const JobStatus(this.label);
  final String label;

  String get key => switch (this) {
        JobStatus.inProgress => 'in_progress',
        JobStatus.onHold => 'on_hold',
        _ => name,
      };

  static JobStatus fromKey(String? k) =>
      JobStatus.values.firstWhere((s) => s.key == k, orElse: () => JobStatus.lead);
}

class Job {
  const Job({
    required this.id,
    required this.title,
    this.description = '',
    required this.status,
    this.serviceAddress = const Address(),
    this.latitude,
    this.longitude,
    this.customer,
    this.crew,
    this.scheduledStart,
    this.scheduledEnd,
    this.completedAt,
    this.estimateTotal = Money.zero,
    this.progress = 0,
    this.coverPhotoUrl,
    this.createdAt,
    this.isShared = false,
  });

  factory Job.fromJson(Json j) => Job(
        id: asInt(j['id']),
        title: asString(j['title']),
        description: asString(j['description']),
        status: JobStatus.fromKey(asStringOrNull(j['status'])),
        serviceAddress: Address.fromJson(asMap(j['serviceAddress'])),
        latitude: asDouble(j['latitude']),
        longitude: asDouble(j['longitude']),
        customer: PersonRef.maybe(j['customer']),
        crew: PersonRef.maybe(j['crew']),
        scheduledStart: asDate(j['scheduledStart']),
        scheduledEnd: asDate(j['scheduledEnd']),
        completedAt: asDate(j['completedAt']),
        estimateTotal: Money.tryParse(j['estimateTotal']) ?? Money.zero,
        progress: asInt(j['progress']).clamp(0, 100),
        coverPhotoUrl: asStringOrNull(j['coverPhotoUrl']),
        createdAt: asDate(j['createdAt']),
        isShared: asBool(j['sharedPublicly'] ?? j['isShared']),
      );

  final int id;
  final String title, description;
  final JobStatus status;
  final Address serviceAddress;
  final double? latitude, longitude;
  final PersonRef? customer, crew;
  final DateTime? scheduledStart, scheduledEnd, completedAt, createdAt;
  final Money estimateTotal;
  final int progress;
  final String? coverPhotoUrl;
  final bool isShared;

  bool get hasCoordinates => latitude != null && longitude != null;
}

class Media {
  const Media({
    required this.id,
    this.jobId,
    required this.kind,
    required this.url,
    this.thumbnailUrl,
    this.caption = '',
    this.isPublic = false,
    this.uploadedBy,
    this.latitude,
    this.longitude,
    this.createdAt,
  });

  factory Media.fromJson(Json j) => Media(
        id: asInt(j['id']),
        jobId: asIntOrNull(j['jobId']),
        kind: asString(j['kind'], 'photo'),
        url: asString(j['url']),
        thumbnailUrl: asStringOrNull(j['thumbnailUrl']),
        caption: asString(j['caption']),
        isPublic: asBool(j['isPublic']),
        uploadedBy: PersonRef.maybe(j['uploadedBy']),
        latitude: asDouble(j['latitude']),
        longitude: asDouble(j['longitude']),
        createdAt: asDate(j['createdAt']),
      );

  final int id;
  final int? jobId;
  final String kind, url, caption;
  final String? thumbnailUrl;
  final bool isPublic;
  final PersonRef? uploadedBy;
  final double? latitude, longitude;
  final DateTime? createdAt;

  bool get isVideo => kind == 'video';
  String get previewUrl => thumbnailUrl ?? url;
}

class StatusUpdate {
  const StatusUpdate({
    required this.id,
    required this.jobId,
    required this.status,
    this.message = '',
    this.author,
    this.media = const [],
    this.visibleToCustomer = true,
    this.createdAt,
  });

  factory StatusUpdate.fromJson(Json j) => StatusUpdate(
        id: asInt(j['id']),
        jobId: asInt(j['jobId']),
        status: JobStatus.fromKey(asStringOrNull(j['status'])),
        message: asString(j['message']),
        author: PersonRef.maybe(j['author']),
        media: asList(j['media'], Media.fromJson),
        visibleToCustomer: asBool(j['visibleToCustomer'], true),
        createdAt: asDate(j['createdAt']),
      );

  final int id, jobId;
  final JobStatus status;
  final String message;
  final PersonRef? author;
  final List<Media> media;
  final bool visibleToCustomer;
  final DateTime? createdAt;
}

class JobLog {
  const JobLog({
    required this.id,
    required this.jobId,
    required this.date,
    this.notes = '',
    this.hours = '',
    this.materials = '',
    this.weather = '',
    this.author,
    this.createdAt,
  });

  factory JobLog.fromJson(Json j) => JobLog(
        id: asInt(j['id']),
        jobId: asInt(j['jobId']),
        date: asString(j['date']),
        notes: asString(j['notes']),
        hours: asString(j['hours']),
        materials: asString(j['materials']),
        weather: asString(j['weather']),
        author: PersonRef.maybe(j['author']),
        createdAt: asDate(j['createdAt']),
      );

  final int id, jobId;
  final String date, notes, hours, materials, weather;
  final PersonRef? author;
  final DateTime? createdAt;
}

class LineItem {
  const LineItem({required this.description, this.quantity = '1', required this.unitPrice, this.explicitTotal});

  factory LineItem.fromJson(Json j) => LineItem(
        description: asString(j['description']),
        quantity: asString(j['quantity'], '1'),
        unitPrice: Money.tryParse(j['unitPrice']) ?? Money.zero,
        explicitTotal: Money.parseOrNull(j['total']),
      );

  final String description, quantity;
  final Money unitPrice;

  /// Total as sent by the server; computed from quantity × price when absent.
  final Money? explicitTotal;

  Money get total => explicitTotal ?? unitPrice.timesQuantity(quantity);

  Json toJson() => {
        'description': description,
        'quantity': quantity,
        'unitPrice': unitPrice.toApi(),
        'total': total.toApi(),
      };
}

class Estimate {
  const Estimate({
    required this.id,
    this.customerId,
    this.jobId,
    required this.status,
    this.serviceType = '',
    this.description = '',
    this.serviceAddress = const Address(),
    this.squareFeet,
    this.lineItems = const [],
    this.total = Money.zero,
    this.validUntil,
    this.notes = '',
    this.customerName = '',
    this.estimator,
    this.media = const [],
    this.createdAt,
    this.preferredDate,
  });

  factory Estimate.fromJson(Json j) => Estimate(
        preferredDate: asStringOrNull(j['preferredDate']),
        id: asInt(j['id']),
        customerId: asIntOrNull(j['customerId']),
        jobId: asIntOrNull(j['jobId']),
        status: asString(j['status'], 'requested'),
        serviceType: asString(j['serviceType']),
        description: asString(j['description']),
        serviceAddress: Address.fromJson(asMap(j['serviceAddress'])),
        squareFeet: asStringOrNull(j['squareFeet']),
        lineItems: asList(j['lineItems'], LineItem.fromJson),
        total: Money.tryParse(j['total']) ?? Money.zero,
        validUntil: asStringOrNull(j['validUntil']),
        notes: asString(j['notes']),
        customerName: asString(j['customerName']),
        estimator: PersonRef.maybe(j['estimator']),
        media: asList(j['media'], Media.fromJson),
        createdAt: asDate(j['createdAt']),
      );

  final int id;
  final int? customerId, jobId;

  /// requested | in_review | sent | accepted | declined | expired
  final String status;
  final String serviceType, description, notes, customerName;
  final Address serviceAddress;
  final String? squareFeet, validUntil, preferredDate;
  final List<LineItem> lineItems;
  final Money total;
  final PersonRef? estimator;
  final List<Media> media;
  final DateTime? createdAt;

  bool get awaitingCustomer => status == 'sent';
}

class Invoice {
  const Invoice({
    required this.id,
    required this.number,
    this.customerId,
    this.jobId,
    required this.status,
    this.issuedAt,
    this.dueAt,
    this.lineItems = const [],
    this.subtotal = Money.zero,
    this.tax = Money.zero,
    this.total = Money.zero,
    this.balance = Money.zero,
    this.customerName = '',
  });

  factory Invoice.fromJson(Json j) => Invoice(
        id: asInt(j['id']),
        number: asString(j['number']),
        customerId: asIntOrNull(j['customerId']),
        jobId: asIntOrNull(j['jobId']),
        status: asString(j['status'], 'draft'),
        issuedAt: asDate(j['issuedAt']),
        dueAt: asDate(j['dueAt']),
        lineItems: asList(j['lineItems'], LineItem.fromJson),
        subtotal: Money.tryParse(j['subtotal']) ?? Money.zero,
        tax: Money.tryParse(j['tax']) ?? Money.zero,
        total: Money.tryParse(j['total']) ?? Money.zero,
        balance: Money.tryParse(j['balance']) ?? Money.zero,
        customerName: asString(j['customerName']),
      );

  final int id;
  final String number;
  final int? customerId, jobId;

  /// draft | sent | paid | partial | overdue | void
  final String status;
  final DateTime? issuedAt, dueAt;
  final List<LineItem> lineItems;
  final Money subtotal, tax, total, balance;
  final String customerName;

  bool get isPayable => balance.cents > 0 && status != 'void' && status != 'draft';
}

class Payment {
  const Payment({
    required this.id,
    required this.invoiceId,
    required this.amount,
    required this.method,
    required this.status,
    this.createdAt,
    this.invoiceNumber = '',
  });

  factory Payment.fromJson(Json j) => Payment(
        id: asInt(j['id']),
        invoiceId: asInt(j['invoiceId']),
        invoiceNumber: asString(j['invoiceNumber']),
        amount: Money.tryParse(j['amount']) ?? Money.zero,
        method: asString(j['method']),
        status: asString(j['status']),
        createdAt: asDate(j['createdAt']),
      );

  final int id, invoiceId;
  final Money amount;
  final String method, status, invoiceNumber;
  final DateTime? createdAt;
}

class TimeEntry {
  const TimeEntry({
    required this.id,
    required this.userId,
    this.userName = '',
    this.jobId,
    required this.clockIn,
    this.clockOut,
    this.hours,
    required this.status,
    this.clockInLat,
    this.clockInLng,
    this.notes = '',
    this.jobTitle = '',
  });

  factory TimeEntry.fromJson(Json j) => TimeEntry(
        jobTitle: asString(j['jobTitle']),
        id: asInt(j['id']),
        userId: asInt(j['userId']),
        userName: asString(j['userName']),
        jobId: asIntOrNull(j['jobId']),
        clockIn: asDate(j['clockIn']) ?? DateTime.now(),
        clockOut: asDate(j['clockOut']),
        hours: asStringOrNull(j['hours']),
        status: asString(j['status'], 'open'),
        clockInLat: asDouble(j['clockInLat']),
        clockInLng: asDouble(j['clockInLng']),
        notes: asString(j['notes']),
      );

  final int id, userId;
  final String userName;
  final int? jobId;
  final DateTime clockIn;
  final DateTime? clockOut;
  final String? hours;

  /// open | submitted | approved | rejected
  final String status;
  final double? clockInLat, clockInLng;
  final String notes, jobTitle;

  Duration elapsed([DateTime? now]) => (clockOut ?? now ?? DateTime.now()).difference(clockIn);
}

class TimeStatus {
  const TimeStatus({
    required this.clockedIn,
    this.entry,
    this.trackingRequired = true,
    this.pingIntervalSeconds = 60,
  });

  factory TimeStatus.fromJson(Json j) => TimeStatus(
        clockedIn: asBool(j['clockedIn']),
        entry: j['entry'] is Map ? TimeEntry.fromJson(asMap(j['entry'])) : null,
        trackingRequired: asBool(j['trackingRequired'], true),
        pingIntervalSeconds: asInt(j['pingIntervalSeconds'], 60),
      );

  final bool clockedIn;
  final TimeEntry? entry;
  final bool trackingRequired;
  final int pingIntervalSeconds;
}

class TimeOffRequest {
  const TimeOffRequest({
    required this.id,
    required this.userId,
    this.userName = '',
    required this.startDate,
    required this.endDate,
    required this.type,
    this.reason = '',
    required this.status,
    this.reviewedBy,
    this.createdAt,
  });

  factory TimeOffRequest.fromJson(Json j) => TimeOffRequest(
        id: asInt(j['id']),
        userId: asInt(j['userId']),
        userName: asString(j['userName']),
        startDate: asString(j['startDate']),
        endDate: asString(j['endDate']),
        type: asString(j['type'], 'vacation'),
        reason: asString(j['reason']),
        status: asString(j['status'], 'pending'),
        reviewedBy: PersonRef.maybe(j['reviewedBy']),
        createdAt: asDate(j['createdAt']),
      );

  final int id, userId;
  final String userName, startDate, endDate, type, reason, status;
  final PersonRef? reviewedBy;
  final DateTime? createdAt;
}

class PayStub {
  const PayStub({
    required this.id,
    required this.periodStart,
    required this.periodEnd,
    required this.payDate,
    this.hours = '0',
    this.gross = Money.zero,
    this.deductions = Money.zero,
    this.net = Money.zero,
    this.pdfUrl,
    this.userName = '',
  });

  factory PayStub.fromJson(Json j) => PayStub(
        id: asInt(j['id']),
        periodStart: asString(j['periodStart']),
        periodEnd: asString(j['periodEnd']),
        payDate: asString(j['payDate']),
        hours: asString(j['hours'], '0'),
        gross: Money.tryParse(j['gross']) ?? Money.zero,
        deductions: Money.tryParse(j['deductions']) ?? Money.zero,
        net: Money.tryParse(j['net']) ?? Money.zero,
        pdfUrl: asStringOrNull(j['pdfUrl']),
        userName: asString(j['userName']),
      );

  final int id;
  final String periodStart, periodEnd, payDate, hours, userName;
  final Money gross, deductions, net;
  final String? pdfUrl;
}

class TaxPaymentPrefs {
  const TaxPaymentPrefs({
    this.filingStatus = 'single',
    this.allowances = 0,
    this.extraWithholding = Money.zero,
    this.payMethod = 'direct_deposit',
    this.bankName = '',
    this.accountLast4 = '',
    this.routingLast4 = '',
  });

  factory TaxPaymentPrefs.fromJson(Json j) => TaxPaymentPrefs(
        filingStatus: asString(j['filingStatus'], 'single'),
        allowances: asInt(j['allowances']),
        extraWithholding: Money.tryParse(j['extraWithholding']) ?? Money.zero,
        payMethod: asString(j['payMethod'], 'direct_deposit'),
        bankName: asString(j['bankName']),
        accountLast4: asString(j['accountLast4']),
        routingLast4: asString(j['routingLast4']),
      );

  final String filingStatus, payMethod, bankName, accountLast4, routingLast4;
  final int allowances;
  final Money extraWithholding;
}

class CrewMember {
  const CrewMember({required this.id, required this.name, this.role = 'employee', this.phone});

  factory CrewMember.fromJson(Json j) => CrewMember(
        id: asInt(j['id']),
        name: asString(j['name']),
        role: asString(j['role'], 'employee'),
        phone: asStringOrNull(j['phone']),
      );

  final int id;
  final String name, role;
  final String? phone;
}

class Crew {
  const Crew({required this.id, required this.name, this.lead, this.members = const [], this.color});

  factory Crew.fromJson(Json j) => Crew(
        id: asInt(j['id']),
        name: asString(j['name']),
        lead: PersonRef.maybe(j['lead']),
        members: asList(j['members'], CrewMember.fromJson),
        color: asStringOrNull(j['color']),
      );

  final int id;
  final String name;
  final PersonRef? lead;
  final List<CrewMember> members;
  final String? color;
}

class ScheduleEntry {
  const ScheduleEntry({
    required this.id,
    this.userId,
    this.crewId,
    this.jobId,
    this.jobTitle = '',
    required this.start,
    required this.end,
    this.notes = '',
    this.address = const Address(),
    this.userName = '',
  });

  factory ScheduleEntry.fromJson(Json j) => ScheduleEntry(
        id: asInt(j['id']),
        userId: asIntOrNull(j['userId']),
        crewId: asIntOrNull(j['crewId']),
        jobId: asIntOrNull(j['jobId']),
        jobTitle: asString(j['jobTitle']),
        start: asDate(j['start']) ?? DateTime.now(),
        end: asDate(j['end']) ?? DateTime.now(),
        notes: asString(j['notes']),
        address: Address.fromJson(asMap(j['address'])),
        userName: asString(j['userName']),
      );

  final int id;
  final int? userId, crewId, jobId;
  final String jobTitle, notes, userName;
  final DateTime start, end;
  final Address address;
}

class RaiseRequest {
  const RaiseRequest({
    required this.id,
    required this.userId,
    this.userName = '',
    required this.kind,
    this.currentRate,
    this.requestedRate,
    this.requestedPosition,
    this.justification = '',
    required this.status,
    this.reviewNote = '',
    this.createdAt,
  });

  factory RaiseRequest.fromJson(Json j) => RaiseRequest(
        id: asInt(j['id']),
        userId: asInt(j['userId']),
        userName: asString(j['userName']),
        kind: asString(j['kind'], 'raise'),
        currentRate: Money.parseOrNull(j['currentRate']),
        requestedRate: Money.parseOrNull(j['requestedRate']),
        requestedPosition: asStringOrNull(j['requestedPosition']),
        justification: asString(j['justification']),
        status: asString(j['status'], 'pending'),
        reviewNote: asString(j['reviewNote']),
        createdAt: asDate(j['createdAt']),
      );

  final int id, userId;
  final String userName, kind, justification, status, reviewNote;
  final Money? currentRate, requestedRate;
  final String? requestedPosition;
  final DateTime? createdAt;
}

class Review {
  const Review({
    required this.id,
    this.jobId,
    this.customer,
    required this.rating,
    this.comment = '',
    this.isPublished = false,
    this.response,
    this.createdAt,
  });

  factory Review.fromJson(Json j) => Review(
        id: asInt(j['id']),
        jobId: asIntOrNull(j['jobId']),
        customer: PersonRef.maybe(j['customer']),
        rating: asInt(j['rating']).clamp(0, 5),
        comment: asString(j['comment']),
        isPublished: asBool(j['isPublished']),
        response: asStringOrNull(j['response']),
        createdAt: asDate(j['createdAt']),
      );

  final int id;
  final int? jobId;
  final PersonRef? customer;
  final int rating;
  final String comment;
  final bool isPublished;
  final String? response;
  final DateTime? createdAt;
}

class GalleryItem {
  const GalleryItem({
    required this.id,
    this.jobId,
    this.jobTitle = '',
    this.customerName = '',
    this.city = '',
    this.media = const [],
    this.review,
    this.createdAt,
  });

  factory GalleryItem.fromJson(Json j) => GalleryItem(
        id: asInt(j['id']),
        jobId: asIntOrNull(j['jobId']),
        jobTitle: asString(j['jobTitle']),
        customerName: asString(j['customerName']),
        city: asString(j['city']),
        media: asList(j['media'], Media.fromJson),
        review: j['review'] is Map ? Review.fromJson(asMap(j['review'])) : null,
        createdAt: asDate(j['createdAt']),
      );

  final int id;
  final int? jobId;
  final String jobTitle, customerName, city;
  final List<Media> media;
  final Review? review;
  final DateTime? createdAt;
}

class Message {
  const Message({required this.id, required this.threadId, this.sender, required this.body, this.createdAt});

  factory Message.fromJson(Json j) => Message(
        id: asInt(j['id']),
        threadId: asInt(j['threadId']),
        sender: PersonRef.maybe(j['sender']),
        body: asString(j['body']),
        createdAt: asDate(j['createdAt']),
      );

  final int id, threadId;
  final PersonRef? sender;
  final String body;
  final DateTime? createdAt;
}

class MessageThread {
  const MessageThread({
    required this.id,
    required this.subject,
    this.jobId,
    this.participants = const [],
    this.lastMessage,
    this.unreadCount = 0,
    this.updatedAt,
  });

  factory MessageThread.fromJson(Json j) => MessageThread(
        id: asInt(j['id']),
        subject: asString(j['subject']),
        jobId: asIntOrNull(j['jobId']),
        participants: asList(j['participants'], PersonRef.fromJson),
        lastMessage: j['lastMessage'] is Map ? Message.fromJson(asMap(j['lastMessage'])) : null,
        unreadCount: asInt(j['unreadCount']),
        updatedAt: asDate(j['updatedAt']),
      );

  final int id;
  final String subject;
  final int? jobId;
  final List<PersonRef> participants;
  final Message? lastMessage;
  final int unreadCount;
  final DateTime? updatedAt;
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    this.body = '',
    this.data = const {},
    this.readAt,
    this.createdAt,
  });

  factory AppNotification.fromJson(Json j) => AppNotification(
        id: asInt(j['id']),
        type: asString(j['type']),
        title: asString(j['title']),
        body: asString(j['body']),
        data: asMap(j['data']),
        readAt: asDate(j['readAt']),
        createdAt: asDate(j['createdAt']),
      );

  final int id;
  final String type, title, body;
  final Json data;
  final DateTime? readAt, createdAt;

  bool get isRead => readAt != null;
  int? get jobId => asIntOrNull(data['jobId']);
}

class LiveLocation {
  const LiveLocation({
    required this.userId,
    required this.name,
    required this.role,
    this.avatarUrl,
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.speed,
    this.heading,
    this.batteryLevel,
    this.recordedAt,
    this.clockedInAt,
    this.currentJob,
  });

  factory LiveLocation.fromJson(Json j) => LiveLocation(
        userId: asInt(j['userId']),
        name: asString(j['name']),
        role: Role.fromKey(asStringOrNull(j['role'])),
        avatarUrl: asStringOrNull(j['avatarUrl']),
        latitude: asDouble(j['latitude']) ?? 0,
        longitude: asDouble(j['longitude']) ?? 0,
        accuracy: asDouble(j['accuracy']),
        speed: asDouble(j['speed']),
        heading: asDouble(j['heading']),
        batteryLevel: asDouble(j['batteryLevel']),
        recordedAt: asDate(j['recordedAt']),
        clockedInAt: asDate(j['clockedInAt']),
        currentJob: j['currentJob'] is Map
            ? PersonRef(id: asInt(asMap(j['currentJob'])['id']), name: asString(asMap(j['currentJob'])['title']))
            : null,
      );

  final int userId;
  final String name;
  final Role role;
  final String? avatarUrl;
  final double latitude, longitude;
  final double? accuracy, speed, heading, batteryLevel;
  final DateTime? recordedAt, clockedInAt;

  /// `{ id, title }` of the job the employee clocked into (title in [PersonRef.name]).
  final PersonRef? currentJob;
}

class TrailPoint {
  const TrailPoint(this.latitude, this.longitude, this.recordedAt);

  factory TrailPoint.fromJson(Json j) =>
      TrailPoint(asDouble(j['latitude']) ?? 0, asDouble(j['longitude']) ?? 0, asDate(j['recordedAt']));

  final double latitude, longitude;
  final DateTime? recordedAt;
}

class Contact {
  const Contact({required this.id, required this.name, required this.role, this.phone, this.email});

  factory Contact.fromJson(Json j) => Contact(
        id: asInt(j['id']),
        name: asString(j['name']),
        role: Role.fromKey(asStringOrNull(j['role'])),
        phone: asStringOrNull(j['phone']),
        email: asStringOrNull(j['email']),
      );

  final int id;
  final String name;
  final Role role;
  final String? phone, email;
}

class RoleDefinition {
  const RoleDefinition({required this.key, required this.name, required this.permissions});

  factory RoleDefinition.fromJson(Json j) => RoleDefinition(
        key: asString(j['key']),
        name: asString(j['name']),
        permissions: asStringList(j['permissions']).toSet(),
      );

  final String key, name;
  final Set<String> permissions;

  bool get isImmutable => key == Role.superAdmin.key;
}

class Dashboard {
  const Dashboard({
    this.activeJobs = 0,
    this.clockedIn = 0,
    this.pendingEstimates = 0,
    this.pendingTimeOff = 0,
    this.overdueInvoices = 0,
    this.revenueMtd = Money.zero,
  });

  factory Dashboard.fromJson(Json j) => Dashboard(
        activeJobs: asInt(j['activeJobs']),
        clockedIn: asInt(j['clockedIn']),
        pendingEstimates: asInt(j['pendingEstimates']),
        pendingTimeOff: asInt(j['pendingTimeOff']),
        overdueInvoices: asInt(j['overdueInvoices']),
        revenueMtd: Money.tryParse(j['revenueMtd']) ?? Money.zero,
      );

  final int activeJobs, clockedIn, pendingEstimates, pendingTimeOff, overdueInvoices;
  final Money revenueMtd;
}

/// Customer as returned by `/customers` (list rows) and `/customers/:id`.
class CustomerRecord {
  const CustomerRecord({
    required this.id,
    required this.name,
    this.email = '',
    this.phone,
    this.address = const Address(),
    this.closed = false,
    this.jobCount = 0,
    this.jobs = const [],
    this.estimates = const [],
    this.invoices = const [],
  });

  factory CustomerRecord.fromJson(Json j) => CustomerRecord(
        id: asInt(j['id']),
        name: asString(j['name'], '${asString(j['firstName'])} ${asString(j['lastName'])}'.trim()),
        email: asString(j['email']),
        phone: asStringOrNull(j['phone']),
        address: Address.fromJson(asMap(j['address'])),
        closed: asBool(j['closed']),
        jobCount: asInt(j['jobCount'], asList(j['jobs'], (e) => e).length),
        jobs: asList(j['jobs'], Job.fromJson),
        estimates: asList(j['estimates'], Estimate.fromJson),
        invoices: asList(j['invoices'], Invoice.fromJson),
      );

  final int id;
  final String name, email;
  final String? phone;
  final Address address;
  final bool closed;
  final int jobCount;
  final List<Job> jobs;
  final List<Estimate> estimates;
  final List<Invoice> invoices;
}

/// Row of `GET /admin/users`.
class AdminUser {
  const AdminUser({
    required this.id,
    required this.email,
    required this.name,
    this.phone,
    this.avatarUrl,
    required this.role,
    this.isActive = true,
    this.closed = false,
    this.payRate,
    this.lastLoginAt,
  });

  factory AdminUser.fromJson(Json j) => AdminUser(
        id: asInt(j['id']),
        email: asString(j['email']),
        name: asString(j['name'], '${asString(j['firstName'])} ${asString(j['lastName'])}'.trim()),
        phone: asStringOrNull(j['phone']),
        avatarUrl: asStringOrNull(j['avatarUrl']),
        role: Role.fromKey(asStringOrNull(j['role'])),
        isActive: asBool(j['isActive'], true),
        closed: asBool(j['closed']),
        payRate: Money.parseOrNull(j['payRate']),
        lastLoginAt: asDate(j['lastLoginAt']),
      );

  final int id;
  final String email, name;
  final String? phone, avatarUrl;
  final Role role;
  final bool isActive, closed;
  final Money? payRate;
  final DateTime? lastLoginAt;
}

class MaintenanceRecord {
  const MaintenanceRecord({required this.id, this.description = '', this.cost, this.performedAt, this.nextDueAt});

  factory MaintenanceRecord.fromJson(Json j) => MaintenanceRecord(
        id: asInt(j['id']),
        description: asString(j['description']),
        cost: Money.parseOrNull(j['cost']),
        performedAt: asDate(j['performedAt']),
        nextDueAt: asDate(j['nextDueAt']),
      );

  final int id;
  final String description;
  final Money? cost;
  final DateTime? performedAt, nextDueAt;
}

class Equipment {
  const Equipment({
    required this.id,
    required this.name,
    this.kind = '',
    this.identifier = '',
    this.status = 'active',
    this.notes = '',
    this.lastServiceAt,
    this.nextDueAt,
    this.maintenance = const [],
  });

  factory Equipment.fromJson(Json j) => Equipment(
        id: asInt(j['id']),
        name: asString(j['name']),
        kind: asString(j['kind']),
        identifier: asString(j['identifier']),
        status: asString(j['status'], 'active'),
        notes: asString(j['notes']),
        lastServiceAt: asDate(j['lastServiceAt']),
        nextDueAt: asDate(j['nextDueAt']),
        maintenance: asList(j['maintenance'], MaintenanceRecord.fromJson),
      );

  final int id;
  final String name, kind, identifier, status, notes;
  final DateTime? lastServiceAt, nextDueAt;
  final List<MaintenanceRecord> maintenance;

  bool get isDue => nextDueAt != null && nextDueAt!.isBefore(DateTime.now());
}

class PayrollRun {
  const PayrollRun({
    required this.id,
    required this.periodStart,
    required this.periodEnd,
    this.stubCount = 0,
    this.gross = Money.zero,
    this.net = Money.zero,
    this.paystubs = const [],
  });

  factory PayrollRun.fromJson(Json j) => PayrollRun(
        id: asInt(j['id']),
        periodStart: asString(j['periodStart']),
        periodEnd: asString(j['periodEnd']),
        stubCount: asInt(j['stubCount']),
        gross: Money.tryParse(j['gross']) ?? Money.zero,
        net: Money.tryParse(j['net']) ?? Money.zero,
        paystubs: asList(j['paystubs'], PayStub.fromJson),
      );

  final int id;
  final String periodStart, periodEnd;
  final int stubCount;
  final Money gross, net;
  final List<PayStub> paystubs;
}
