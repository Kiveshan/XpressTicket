import React from "react";
import { useNavigate } from "react-router-dom";
import "./ViewInvoice.css";

const invoiceData = {
  university: {
    name: "Durban University of Technology",
    address: "7 Ritson Road Overport, Durban, 4001 South Africa",
    phone: "+27 31 373 2000",
    date: "February 6 2025",
  },
  purchaser: {
    name: "Rorrick Shaun",
    email: "12345678@dut.ac.za",
    address: "15 Wisteria Lane, Springfield, United States of America, 62704",
    title: "Professor",
    VAT: "4210201946",
    institution: "University of Kwa-Zulu Natal",
    department: "Information Systems",
    faculty: "Accounting and Informatics",
  },
  item: {
    description:
      "1 x Presenting Author (In-person): NONIEEE member (inclusive of Gala dinner)",
    price: 6500,
  },
  vat: 975,
  total: 7475,
  payment: {
    bank: "Standard Bank",
    accountName: "DUT",
    type: "Cheque",
    number: "00000",
    branch: "Queensburgh",
    code: "025109",
    reference: "REF012544829",
  },
};

function VieWInvoice() {
    const navigate = useNavigate();
  const handleBack = () => {
    window.history.back();
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="invoice-container">
      <header>
        <h1>DUT Invoice</h1>
        <img src="/DUT-logo.jpg" alt="Dut Logo" className="logo23" />
        <p>{invoiceData.university.name}</p>
        <p>{invoiceData.university.address}</p>
        <p>Tel: {invoiceData.university.phone}</p>
        <p>Invoice Date: {invoiceData.university.date}</p>
      </header>

      <section className="purchaser-info">
        <h2>Purchaser Information</h2>
        {Object.entries(invoiceData.purchaser).map(([key, value]) => (
          <p key={key}>
            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
          </p>
        ))}
      </section>

      <section className="invoice-details">
        <h2>Invoice Details</h2>
        <p>{invoiceData.item.description}</p>
        <p>Sub total: R{invoiceData.item.price.toLocaleString()}</p>
        <p>VAT (15%): R{invoiceData.vat.toLocaleString()}</p>
        <h3>Total Amount Due: R{invoiceData.total.toLocaleString()}</h3>
      </section>

      <section className="payment-info">
        <h2>Bank Details</h2>
        {Object.entries(invoiceData.payment).map(([key, value]) => (
          <p key={key}>
            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
          </p>
        ))}
        <p className="note">
          NB: Please use the reference number above when making payment
        </p>
      </section>

      <footer>
        <p className="thank-you">
          Thank you for choosing Presenting Author. We look forward to your participation in the ICTAS conference!
        </p>
        <div className="button-container1">
          <button onClick={handleBack} >Back</button>
          <button onClick={handleDownload}>Download</button>
        </div>
      </footer>
    </div>
  );
}

export default VieWInvoice;
