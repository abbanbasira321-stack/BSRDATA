const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// TEST API / WALLET BALANCE
// ===============================
app.get("/api/test", async (req, res) => {
  try {
    const url = new URL(
      "https://www.nellobytesystems.com/APIWalletBalanceV1.asp"
    );

    url.searchParams.set("UserID", process.env.CK_USERID);
    url.searchParams.set("APIKey", process.env.CK_APIKEY);

const response = await fetch(url);

if (!response.ok) {
  return res.status(502).json({
    status: "ERROR",
    message: "NelloByte query request failed"
  });
}

const data = await response.json();

res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "ERROR",
      message: "API connection failed"
    });
  }
});
// ===============================
// DATA PLANS
// ===============================
app.get("/api/plans", async (req, res) => {
  try {

    const apiUrl =
      "https://www.nellobytesystems.com/APIDatabundlePlansV2.asp";

    console.log("Loading data plans...");

    const response = await fetch(apiUrl);

    console.log("NelloByte status:", response.status);
    console.log(
      "NelloByte content-type:",
      response.headers.get("content-type")
    );

    if (!response.ok) {
      throw new Error(
        "NelloByte HTTP status: " + response.status
      );
    }

    const text = await response.text();

    console.log(
      "NelloByte response length:",
      text.length
    );

    if (!text.trim()) {
      throw new Error("Empty response from NelloByte");
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (jsonError) {
      console.error(
        "JSON PARSE ERROR:",
        jsonError.message
      );

      console.error(
        "Response start:",
        text.substring(0, 300)
      );

      throw new Error(
        "NelloByte returned invalid JSON"
      );
    }

    if (!data.MOBILE_NETWORK) {
      throw new Error(
        "MOBILE_NETWORK missing from response"
      );
    }

    console.log(
      "Networks:",
      Object.keys(data.MOBILE_NETWORK)
    );

    res.json(data);

  } catch (error) {

    console.error(
      "PLANS ERROR:",
      error
    );

    res.status(500).json({
      status: "ERROR",
      message: "Failed to load data plans"
    });
  }
});

// ===============================
// BUY DATA
// ===============================
app.post("/api/buydata", async (req, res) => {
  try {

    const {
      network,
      phone,
      plan
    } = req.body;

    // Check required fields
    if (!network || !phone || !plan) {
      return res.status(400).json({
        status: "ERROR",
        message: "Network, phone and data plan are required"
      });
    }

// Basic phone validation
if (!/^0\d{10}$/.test(phone)) {
  return res.status(400).json({
    status: "ERROR",
    message: "Invalid Nigerian phone number"
  });
}

// Verify that the selected plan belongs to the selected network
const plansResponse = await fetch(
  "https://www.nellobytesystems.com/APIDatabundlePlansV2.asp"
);

if (!plansResponse.ok) {
  return res.status(502).json({
    status: "ERROR",
    message: "Unable to verify data plan"
  });
}

const plans = await plansResponse.json();

const networkPlans =
  plans.MOBILE_NETWORK?.[network];

if (!networkPlans || !networkPlans[0]) {
  return res.status(400).json({
    status: "ERROR",
    message: "Invalid mobile network"
  });
}

const selectedProduct =
  (networkPlans[0].PRODUCT || []).find(
    product =>
      product.PRODUCT_ID === String(plan)
  );

if (!selectedProduct) {
  return res.status(400).json({
    status: "ERROR",
    message: "Invalid data plan for selected network"
  });
}

console.log("Verified plan:", {
  network,
  productID: selectedProduct.PRODUCT_ID,
  productCode: selectedProduct.PRODUCT_CODE,
  productName: selectedProduct.PRODUCT_NAME,
  amount: selectedProduct.PRODUCT_AMOUNT
});

// Generate unique RequestID

    const requestID =
      "BSR" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    const url = new URL(
      "https://www.nellobytesystems.com/APIDatabundleV1.asp"
    );

    url.searchParams.set(
      "UserID",
      process.env.CK_USERID
    );

    url.searchParams.set(
      "APIKey",
      process.env.CK_APIKEY
    );

    url.searchParams.set(
      "MobileNetwork",
      network
    );

    url.searchParams.set(
      "DataPlan",
      plan
    );

    url.searchParams.set(
      "MobileNumber",
      phone
    );

    url.searchParams.set(
      "RequestID",
      requestID
    );

    // Optional callback
    if (process.env.CALLBACK_URL) {
      url.searchParams.set(
        "CallBackURL",
        process.env.CALLBACK_URL
      );
    }

    console.log("Sending data order:", {
      network,
      phone,
      plan,
      requestID
    });

    const response = await fetch(url);

    const data = await response.json();

    console.log("Nellobyte response:", data);

res.json({
  status: data.status || data.Status || "UNKNOWN",
  orderID: data.orderID || data.OrderID || null,
  requestID: requestID,
  remark: data.remark || data.Remark || data.message || "",
  response: data
});

  } catch (error) {

    console.error("BUY DATA ERROR:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Data purchase API failed"
    });
  }
});


// ===============================
// QUERY TRANSACTION
// ===============================
app.get("/api/query", async (req, res) => {
  try {

    const { orderID } = req.query;

if (!orderID) {
  return res.status(400).json({
    status: "ERROR",
    message: "orderID is required"
  });
}

    const url = new URL(
      "https://www.nellobytesystems.com/APIQueryV1.asp"
    );

    url.searchParams.set(
      "UserID",
      process.env.CK_USERID
    );

    url.searchParams.set(
      "APIKey",
      process.env.CK_APIKEY
    );

url.searchParams.set(
  "OrderID",
  orderID
);

    const response = await fetch(url);

    const data = await response.json();

    res.json(data);

  } catch (error) {

    console.error("QUERY ERROR:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Transaction query failed"
    });
  }
});


// ===============================
// START SERVER
// ===============================
app.listen(process.env.PORT || 3000, () => {
  console.log("BSR DATA backend running");
});
