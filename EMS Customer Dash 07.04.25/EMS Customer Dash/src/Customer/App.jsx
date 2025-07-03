import React from "react";
import { BrowserRouter as Router, Routes ,Route} from "react-router-dom";
import Form from "./Form";
import InformationForm from "./InformationForm";
import Menupage from "./Menupage";
import CustomerDash from "./CustomerDash";
import EventMenu from "./EventMenu";
import ReviewParchase from "./ReviewParchase";
import ParchasedTicket from "./ParchasedTicket";
import CustomerViewEvent from "./CustomerViewEvent";
import EventTicketPackage from "./EventTicketPackage";
import Conference from "./Conference";
import Daypass from "./DayPass";
import Invoice from "./Invoice";
import Tickets from "./Tickets";
import TicketsList from "./TicketsList";
import ViewTickets from "./ViewTickets";
import ViewMoreDetails from "./ViewMoreDetails";
import TicketDetails from "./TicketsDetails";
import VieWInvoice from "./VieWInvoice"; 
import CustomerUploadPOP from "./CustomerUploadPOP";
import ConfirmTicketPackage from "./ConfirmTicketPackage";
import CustomerFillinTicketPack1 from "./CustomerFillinTicketPack1";


// Organiser
import OrganiserDash from "../Organiser/OrganiserDash";
import RequestCard from "../Organiser/RequestCard";
import TicketsRequest from "../Organiser/TicketsRequest";
import TicketsEventList from "../Organiser/TicketsEventList";
import EventList from "../Organiser/EventList";
import EventForm from "../Organiser/EventForm";
import EventRequest from "../Organiser/EventRequest";
import ViewEventRequest from "../Organiser/ViewEventRequest";
import EventGuestList from "../Organiser/EventGuestList";
import Analytics from "../Organiser/Analytics";
import TicketPaymentList from "../Organiser/TicketsPaymentList";
import TicketPayment from "../Organiser/TicketPayment";

// Admin
import AdminDash from "../Admin/AdminDash";
import EventApproval from "../Admin/EventApproval";
import AdminViewEventRequest from "../Admin/AdminViewEventRequest";
import SystemUsers from "../Admin/SystemUsers";
import ViewingCustomer from "../Admin/ViewingCustomer";
import ViewingOrganiser from "../Admin/ViewingOrganiser";
var userIsRegistered = true;

function App() {
  return (
    <Router 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    > 
      <div className="container">
        <Routes>
          {/* Customer */}
          <Route path="/" element={<Form />}/>
          <Route path="/information-form" element={<InformationForm />}/>
          <Route path= "/mainmenu" element={<Menupage />}/>
          <Route path= "/customerdash" element={<CustomerDash />}/>
          <Route path= "/eventmenu" element={<EventMenu />}/>
          <Route path= "/reviewparchase" element={<ReviewParchase />}/>
          <Route path= "/parchasedticket" element={<ParchasedTicket />}/>
          <Route path= "/view-more-details" element={<ViewMoreDetails />}/>
          <Route path= "/ticketdetails" element={<TicketDetails />}/>
          <Route path= "/customerviewevent" element={<CustomerViewEvent />}/>
          <Route path= "/eventticketpackage" element={<EventTicketPackage />}/>      
          <Route path="/customerticketdetails1" element={<CustomerFillinTicketPack1 />} />
          <Route path= "/customer-ticket-details2" element={<Conference />} />
          <Route path= "/customer-ticket-details3" element={<Daypass />} />
          <Route path= "/invoice" element={<Invoice />} />
          <Route path= "/tickets" element={<Tickets />} />
          <Route path= "/ticketslist" element={<TicketsList />} />
          <Route path= "/viewtickets" element={<ViewTickets />} />
          <Route path= "/viewinvoice" element={<VieWInvoice />} />
          <Route path= "/uploadpop" element={<CustomerUploadPOP />} />
          <Route path="/confirm-ticket-package" element={<ConfirmTicketPackage />} />


          {/* Organiser */}
          <Route path="/organiser-dash" element={<OrganiserDash />} />
          <Route path="/requestcard" element={<RequestCard/>}/>
          <Route path="/ticketsrequest/:eventId" element={<TicketsRequest />} />
          <Route path="/tickets-event-list" element={<TicketsEventList />} />
          <Route path="/event-form" element={<EventForm />} />
          <Route path="/event-request" element={<EventRequest />} />
          <Route path="/viewerequest" element={<ViewEventRequest />} />
          <Route path="/event-list" element={<EventList />} />
          <Route path="/event-guest/:eventId" element={<EventGuestList />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ticketspaymentlist" element={<TicketPaymentList />} />
          <Route path="/ticketspayment/:purchaseId" element={<TicketPayment />} />
          


          {/* Admin */}
          <Route path="/admin-dash" element={<AdminDash />} />
          <Route path="/event-approval" element={<EventApproval />} />
          <Route path="/adminvieweventrequest" element={<AdminViewEventRequest />} />
          <Route path="/users" element={<SystemUsers />} />
          <Route path="/viewingcustomer" element={<ViewingCustomer />} />
          <Route path="/viewingorganiser" element={<ViewingOrganiser />} />
        </Routes> 
      {/* <CustomerFillinTicketPack /> */}
    </div>
    </Router>
  );
}

export default App;
