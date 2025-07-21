import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import "../shared/HeaderOverrides.css"
import Form from "./Form"
import InformationForm from "./InformationForm"
import NewMenupage from "./NewMenupage"
import NewCustomerDash from "./NewCustomerDash"
import EventMenu from "./EventMenu"
import ReviewParchase from "./ReviewParchase"
import ParchasedTicket from "./ParchasedTicket"
import CustomerViewEvent from "./CustomerViewEvent"
import EventTicketPackage from "./EventTicketPackage"
import Conference from "./Conference"
import Daypass from "./DayPass"
import Invoice from "./Invoice"
import Tickets from "./Tickets"
import TicketsList from "./TicketsList"
import ViewTickets from "./ViewTickets"
import ViewMoreDetailsCompact from "./ViewMoreDetailsCompact"
import TicketDetails from "./TicketsDetails"
import VieWInvoice from "./VieWInvoice"
import CustomerUploadPOP from "./CustomerUploadPOP"
import ConfirmTicketPackage from "./ConfirmTicketPackage"
import CustomerFillinTicketPack1 from "./CustomerFillinTicketPack1"
import Receipt from "./Receipt"
import InvoicePreview from "./InvoicePreview"

// Organiser
import OrganiserDash from "../Organiser/OrganiserDash"
import RequestCard from "../Organiser/RequestCard"
import TicketsRequest from "../Organiser/TicketsRequest"
import TicketsEventList from "../Organiser/TicketsEventList"
import EventList from "../Organiser/EventList"
import EventForm from "../Organiser/EventForm"
import EventRequest from "../Organiser/EventRequest"
import ViewEventRequest from "../Organiser/ViewEventRequest"
import EventGuestList from "../Organiser/EventGuestList"
import TicketsPaymentList from "../Organiser/TicketsPaymentList"
import Analytics from "../Organiser/Analytics"
import TicketPayment from "../Organiser/TicketPayment"
import RehostEventForm from "../Organiser/RehostEventForm"
import RehostEventDetails from "../Organiser/RehostEventDetails"

// Admin
import AdminDash from "../Admin/AdminDash"
import EventApproval from "../Admin/EventApproval"
import EventsHistory from "../Admin/EventsHistory"
import AdminViewEventRequest from "../Admin/AdminViewEventRequest"
import SystemUsers from "../Admin/SystemUsers"
import ViewingCustomer from "../Admin/ViewingCustomer"
import ViewingOrganiser from "../Admin/ViewingOrganiser"

var userIsRegistered = true

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div style={{ width: "100%", minHeight: "100vh", margin: 0, padding: 0 }}>
        <Routes>
          {/* Customer */}
          <Route path="/" element={<Form />} />
          <Route path="/information-form" element={<InformationForm />} />
          <Route path="/mainmenu" element={<NewMenupage />} />
          <Route path="/customerdash" element={<NewCustomerDash />} />
          <Route path="/eventmenu" element={<EventMenu />} />
          <Route path="/reviewparchase" element={<ReviewParchase />} />
          <Route path="/parchasedticket" element={<ParchasedTicket />} />
          <Route path="/view-more-details" element={<ViewMoreDetailsCompact />} />
          <Route path="/viewmoredetails/:id" element={<ViewMoreDetailsCompact />} />
          <Route path="/ticketdetails" element={<TicketDetails />} />
          <Route path="/customerviewevent/:eventId" element={<CustomerViewEvent />} />
          <Route path="/eventticketpackage/:eventId" element={<EventTicketPackage />} />
          <Route path="/customerticketdetails1/:eventId/:packageIndex" element={<CustomerFillinTicketPack1 />} />
          <Route path="/customer-ticket-details2" element={<Conference />} />
          <Route path="/customer-ticket-details3" element={<Daypass />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/ticketslist" element={<TicketsList />} />
          <Route path="/viewtickets" element={<ViewTickets />} />
          <Route path="/viewinvoice" element={<VieWInvoice />} />
          <Route path="/uploadpop" element={<CustomerUploadPOP />} />
          <Route path="/confirm-ticket-package/:eventId/:packageIndex" element={<ConfirmTicketPackage />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/invoice-preview" element={<InvoicePreview />} />

          {/* Organiser */}
          <Route path="/organiser-dash" element={<OrganiserDash />} />
          <Route path="/requestcard" element={<RequestCard />} />
          <Route path="/ticketsrequest/:eventId" element={<TicketsRequest />} />
          <Route path="/tickets-event-list" element={<TicketsEventList />} />
          <Route path="/event-form" element={<EventForm />} />
          <Route path="/event-request" element={<EventRequest />} />
          <Route path="/viewerequest" element={<ViewEventRequest />} />
          <Route path="/event-list" element={<EventList />} />
          <Route path="/event-guest/:eventId" element={<EventGuestList />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ticketspaymentlist" element={<TicketsPaymentList />} />
          <Route path="/ticketspayment/:purchaseId" element={<TicketPayment />} />
          <Route path="/ticketspayment/:purchaseId" element={<TicketPayment />} />
          <Route path="/rehost-event" element={<RehostEventForm />} />
          <Route path="/view-past-event" element={<RehostEventDetails />} />

          {/* Admin */}
          <Route path="/admin-dash" element={<AdminDash />} />
          <Route path="/event-approval" element={<EventApproval />} />
          <Route path="/events-history" element={<EventsHistory />} />
          <Route path="/adminvieweventrequest" element={<AdminViewEventRequest />} />
          <Route path="/users" element={<SystemUsers />} />
          <Route path="/viewingcustomer" element={<ViewingCustomer />} />
          <Route path="/viewingorganiser" element={<ViewingOrganiser />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
