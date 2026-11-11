import SwiftUI
import SafariServices

/// Customer invoices + payment history. "Pay" opens Stripe Checkout in Safari View Controller.
struct BillingView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var checkout: CheckoutLink? = nil
    @State private var payInvoice: Invoice? = nil

    private struct Payload { var invoices: [Invoice]; var payments: [Payment] }

    var body: some View {
        LoadableView(id: reload, load: { () async throws -> Payload in
            let api = session.api
            async let invoices: [Invoice] = api.get("/portal/invoices")
            async let payments: [Payment] = api.get("/portal/payments")
            return try await Payload(invoices: invoices, payments: payments)
        }) { payload in
            List {
                Section("Invoices") {
                    if payload.invoices.isEmpty { Text("No invoices yet.").foregroundStyle(.secondary) }
                    ForEach(payload.invoices) { invoice in
                        NavigationLink { InvoiceDetailView(invoice: invoice) } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(invoice.number ?? "Invoice #\(invoice.id)").font(.headline)
                                    Spacer()
                                    Text(invoice.total.currency).monospacedDigit()
                                }
                                HStack {
                                    StatusBadge(text: invoice.status.rawValue.capitalized, color: invoice.status.color)
                                    if let due = invoice.dueAt { Text("Due \(due.shortDate)").font(.caption).foregroundStyle(.secondary) }
                                    Spacer()
                                    if invoice.isPayable && session.can(.paymentsMake) {
                                        Button("Pay \(invoice.amountDue.currency)") { payInvoice = invoice }
                                            .buttonStyle(.borderedProminent).controlSize(.small)
                                    }
                                }
                            }
                        }
                    }
                }
                Section("Payment History") {
                    if payload.payments.isEmpty { Text("No payments yet.").foregroundStyle(.secondary) }
                    ForEach(payload.payments) { payment in
                        LabeledContent {
                            Text(payment.amount.currency).monospacedDigit()
                        } label: {
                            VStack(alignment: .leading) {
                                Text((payment.method ?? "payment").capitalized)
                                Text("\(payment.createdAt.shortDate) · \((payment.status ?? "").capitalized)")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Billing")
        .sheet(item: $payInvoice) { invoice in
            PayInvoiceSheet(invoice: invoice) { url in
                if let url { checkout = CheckoutLink(url: url) }
                reload = UUID()
            }
        }
        .sheet(item: $checkout, onDismiss: { reload = UUID() }) { link in
            SafariView(url: link.url).ignoresSafeArea()
        }
    }
}

struct CheckoutLink: Identifiable { let url: URL; var id: String { url.absoluteString } }

struct PayInvoiceSheet: View {
    let invoice: Invoice
    let onCheckout: (URL?) -> Void
    @EnvironmentObject private var session: Session
    @State private var amount: DecimalString = .zero
    @State private var message: String? = nil

    var body: some View {
        FormSheet(title: "Pay Invoice", saveTitle: "Continue",
                  canSave: amount > .zero && amount <= invoice.amountDue) {
            let response: CheckoutResponse = try await session.api.post(
                "/portal/invoices/\(invoice.id)/pay", body: ["amount": .string(amount.moneyString)])
            onCheckout(response.checkoutUrl)
        } content: {
            Section {
                LabeledContent("Balance due", value: invoice.amountDue.currency)
                DecimalField(title: "Amount", value: $amount)
            } footer: {
                Text("You'll complete payment securely on our payment page. If online payment isn't set up yet, the office will be notified to collect your payment.")
            }
        }
        .onAppear { amount = invoice.amountDue }
    }
}

struct InvoiceDetailView: View {
    let invoice: Invoice
    var body: some View {
        List {
            Section {
                InfoRow(label: "Number", value: invoice.number)
                InfoRow(label: "Customer", value: invoice.customerName)
                InfoRow(label: "Issued", value: invoice.issuedAt?.shortDate)
                InfoRow(label: "Due", value: invoice.dueAt?.shortDate)
                LabeledContent("Status") { StatusBadge(text: invoice.status.rawValue.capitalized, color: invoice.status.color) }
            }
            if let items = invoice.lineItems, !items.isEmpty {
                Section("Items") {
                    ForEach(items) { item in
                        LabeledContent(item.description) { Text((item.total ?? item.computedTotal).currency) }
                    }
                }
            }
            Section {
                InfoRow(label: "Subtotal", value: invoice.subtotal?.currency)
                InfoRow(label: "Tax", value: invoice.tax?.currency)
                LabeledContent("Total") { Text(invoice.total.currency).bold() }
                LabeledContent("Balance") { Text(invoice.amountDue.currency).bold() }
            }
            if let payments = invoice.payments, !payments.isEmpty {
                Section("Payments") {
                    ForEach(payments) { payment in
                        LabeledContent("\((payment.method ?? "payment").capitalized) · \(payment.createdAt.shortDate)") {
                            Text(payment.amount.currency).monospacedDigit()
                        }
                    }
                }
            }
        }
        .navigationTitle(invoice.number ?? "Invoice")
    }
}

struct SafariView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController { SFSafariViewController(url: url) }
    func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}
