const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
// ===============================
// ADMIN LOGIN
// ===============================
app.post("/api/admin/login", (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        status: "ERROR",
        message: "Admin PIN is required"
      });
    }

    if (String(pin) !== String(process.env.ADMIN_PIN)) {
      return res.status(401).json({
        status: "ERROR",
        message: "Invalid Admin PIN"
      });
    }

    res.json({
      status: "SUCCESS",
      message: "Admin login successful"
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Unable to login"
    });
  }
});
const fs = require("fs");
const path = require("path");

app.use(express.static(path.join(__dirname, "www")));
const paymentsFile =
  path.join(__dirname, "data", "payments.json");

const walletsFile =
  path.join(__dirname, "data", "wallets.json");

const transactionsFile =
  path.join(__dirname, "data", "transactions.json");

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "[]");
    }

    return JSON.parse(
      fs.readFileSync(file, "utf8")
    );
  } catch (error) {
    console.error("READ JSON ERROR:", error);
    return [];
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2)
  );
}
function readPayments() {
  try {
    if (!fs.existsSync(paymentsFile)) {
      fs.writeFileSync(paymentsFile, "[]");
    }

    return JSON.parse(
      fs.readFileSync(paymentsFile, "utf8")
    );
  } catch (error) {
    console.error("READ PAYMENTS ERROR:", error);
    return [];
  }
}

function savePayments(payments) {
  fs.writeFileSync(
    paymentsFile,
    JSON.stringify(payments, null, 2)
  );
}

// ===============================
// FUND WALLET - SUBMIT PAYMENT
// ===============================
app.post("/api/fundwallet", (req, res) => {
  try {

const {
  phone,
  amount,
  reference
} = req.body;
if (!phone || !/^0\d{10}$/.test(phone)) {
  return res.status(400).json({
    status: "ERROR",
    message: "Valid Nigerian phone number is required"
  });
}

    if (!amount || Number(amount) < 100) {
      return res.status(400).json({
        status: "ERROR",
        message: "Minimum funding amount is ₦100"
      });
    }

    if (!reference || !String(reference).trim()) {
      return res.status(400).json({
        status: "ERROR",
        message: "Transaction reference is required"
      });
    }

    const payments = readPayments();

    const cleanReference =
      String(reference).trim();

    // Prevent duplicate transaction reference
    const duplicate =
      payments.find(
        payment =>
          payment.reference === cleanReference
      );

    if (duplicate) {
      return res.status(409).json({
        status: "ERROR",
        message: "This transaction reference has already been submitted"
      });
    }

    const payment = {
      id:
       "PAY" +
        Date.now() +
        Math.floor(Math.random() * 1000),

phone: phone,

      amount: Number(amount),

      reference:
        cleanReference,

      bank: "OPay",

      accountName:
        "Yahaya Muazu",

      accountNumber:
        "9025851659",

      status:
        "PENDING",

      createdAt:
        new Date().toISOString()
    };

    payments.push(payment);

    savePayments(payments);

    console.log(
      "FUND WALLET PAYMENT:",
      payment
    );

    res.json({
      status: "PENDING",
      message:
        "Payment submitted. Waiting for confirmation.",
      paymentID:
        payment.id
    });

  } catch (error) {

    console.error(
      "FUND WALLET ERROR:",
      error
    );

    res.status(500).json({
      status: "ERROR",
      message:
        "Unable to submit payment"
    });
  }
});

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

// ===============================
// MOCK BUY DATA TEST
// No real Nellobyte request
// ===============================

if (process.env.MOCK_BUY === "true") {

  console.log("MOCK BUY DATA:", {
    network,
    phone,
    plan,
    requestID
  });

  const data = {
    status: "SUCCESS",
    orderID: "MOCK-" + requestID,
    remark: "Mock data purchase successful"
  };

  console.log("MOCK Nellobyte response:", data);

  // Continue through the normal wallet-deduction code
}

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

    console.log("BUY DATA REQUEST FROM BROWSER:", {
      network,
      phone,
      plan
    });

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
// ===============================
// CHECK USER WALLET BALANCE
// ===============================

const wallets = readJSON(walletsFile);

const wallet = wallets.find(
  item => item.phone === phone
);

if (!wallet) {
  return res.status(400).json({
    status: "ERROR",
    message: "Wallet not found"
  });
}

const walletBalance =
  Number(wallet.balance);

const planAmount =
  Number(selectedProduct.PRODUCT_AMOUNT);

console.log("Wallet check:", {
  phone,
  balance: walletBalance,
  planAmount
});

if (walletBalance < planAmount) {
  return res.status(400).json({
    status: "INSUFFICIENT_BALANCE",
    message: "Insufficient wallet balance",
    balance: walletBalance.toFixed(2),
    required: planAmount.toFixed(2)
  });
}

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

let data;

// ===============================
// MOCK / REAL BUY MODE
// ===============================

if (process.env.MOCK_BUY === "true") {

  console.log("MOCK BUY DATA - NO REAL API REQUEST:", {
    network,
    phone,
    plan,
    requestID
  });

  data = {
    status: "SUCCESS",
    orderID: "MOCK-" + requestID,
    remark: "Mock data purchase successful"
  };

} else {

  console.log("Sending REAL data order:", {
    network,
    phone,
    plan,
    requestID
  });

  const response = await fetch(url);

  data = await response.json();

  console.log("Nellobyte response:", data);
}

// ===============================
// DEDUCT WALLET ONLY AFTER SUCCESS
// ===============================

const orderStatus =
  String(
    data.status ||
    data.Status ||
    ""
  ).toUpperCase();

const orderSuccessful =
  orderStatus === "SUCCESS" ||
  orderStatus === "COMPLETED";

if (orderSuccessful) {

  const wallets = readJSON(walletsFile);

  const walletIndex =
    wallets.findIndex(
      item => item.phone === phone
    );

  if (walletIndex === -1) {
    return res.status(400).json({
      status: "ERROR",
      message: "Wallet not found"
    });
  }

  const currentBalance =
    Number(wallets[walletIndex].balance);

  const planAmount =
    Number(selectedProduct.PRODUCT_AMOUNT);

  if (currentBalance < planAmount) {
    return res.status(400).json({
      status: "INSUFFICIENT_BALANCE",
      message: "Insufficient wallet balance"
    });
  }

  wallets[walletIndex].balance =
    (currentBalance - planAmount).toFixed(2);

  saveJSON(walletsFile, wallets);

  const transactions =
    readJSON(transactionsFile);

  transactions.push({
    id:
      "TXN" +
      Date.now(),

    phone: phone,

    type: "DATA_PURCHASE",

    amount: planAmount,

    network: network,

    plan: selectedProduct.PRODUCT_ID,

    planName:
      selectedProduct.PRODUCT_NAME,

    requestID: requestID,

    status: "SUCCESS",

    createdAt:
      new Date().toISOString()
  });

  saveJSON(
    transactionsFile,
    transactions
  );
}

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
// CHECK WALLET BALANCE ONLY
// NO BUY REQUEST
// ===============================
app.get("/api/check-balance", (req, res) => {
  try {

    const phone =
      String(req.query.phone || "").trim();

    if (!/^0\d{10}$/.test(phone)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Valid Nigerian phone number is required"
      });
    }

    const wallets =
      readJSON(walletsFile);

    const wallet =
      wallets.find(
        item => item.phone === phone
      );

    if (!wallet) {
      return res.json({
        status: "NOT_FOUND",
        phone: phone,
        balance: "0.00"
      });
    }

    res.json({
      status: "SUCCESS",
      phone: wallet.phone,
      balance:
        Number(wallet.balance).toFixed(2)
    });

  } catch (error) {

    console.error(
      "CHECK BALANCE ERROR:",
      error
    );

    res.status(500).json({
      status: "ERROR",
      message: "Unable to check wallet balance"
    });
  }
});
// ===============================
// ADMIN - GET ALL TRANSACTIONS
// ===============================
app.get("/api/admin/transactions", (req, res) => {
  try {

    const transactions =
      readJSON(transactionsFile);

    res.json({
      status: "SUCCESS",
      transactions: transactions
    });

  } catch (error) {

    console.error(
      "ADMIN TRANSACTIONS ERROR:",
      error
    );

    res.status(500).json({
      status: "ERROR",
      message:
        "Unable to load transactions"
    });
  }
});
// ===============================
// ADMIN - GET USERS
// ===============================
app.get("/api/admin/users", (req, res) => {
  try {
    const wallets = readJSON(walletsFile);
    const transactions = readJSON(transactionsFile);

    const users = wallets.map((wallet) => {
      const phone = wallet.phone;

      const userTransactions = transactions.filter(
        (tx) => tx.phone === phone
      );

      const totalTransactions = userTransactions.length;

      const totalSpent = userTransactions
        .filter((tx) => tx.type === "DATA_PURCHASE")
        .reduce(
          (sum, tx) => sum + Number(tx.amount || 0),
          0
        );

      const totalFunded = userTransactions
        .filter((tx) => tx.type === "WALLET_FUND")
        .reduce(
          (sum, tx) => sum + Number(tx.amount || 0),
          0
        );

      return {
        phone: phone,
        balance: Number(wallet.balance || 0),
        createdAt: wallet.createdAt || null,
        totalTransactions: totalTransactions,
        totalFunded: totalFunded,
        totalSpent: totalSpent
      };
    });

    res.json({
      status: "SUCCESS",
      users: users
    });

  } catch (error) {
    console.error("ADMIN USERS ERROR:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Unable to load users"
    });
  }
});
// ===============================
// START SERVER
// ===============================
app.listen(process.env.PORT || 3000, () => {
  console.log("BSR DATA backend running");
});
// ===============================
// GET WALLET BALANCE
// ===============================
app.get("/api/wallet", (req, res) => {
  try {

    const phone =
      String(req.query.phone || "").trim();

    if (!/^0\d{10}$/.test(phone)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Valid phone number is required"
      });
    }

    const wallets =
      readJSON(walletsFile);

    let wallet =
      wallets.find(
        item => item.phone === phone
      );

    if (!wallet) {

      wallet = {
        phone: phone,
        balance: 0,
        createdAt:
          new Date().toISOString()
      };

      wallets.push(wallet);

      saveJSON(
        walletsFile,
        wallets
      );
    }

    res.json({
      status: "SUCCESS",
      phone: wallet.phone,
      balance: Number(wallet.balance).toFixed(2)
    });

  } catch (error) {

    console.error(
      "WALLET ERROR:",
      error
    );

    res.status(500).json({
      status: "ERROR",
      message: "Unable to load wallet"
    });
  }
});
// ===============================
// ADMIN LIST PAYMENTS
// ===============================
app.get("/api/admin/payments", (req, res) => {
  try {

    const payments = readPayments();

    res.json({
      status: "SUCCESS",
      payments: payments
    });

  } catch (error) {

    console.error(
      "ADMIN PAYMENTS ERROR:",
      error
    );

    res.status(500).json({
      status: "ERROR",
      message: "Unable to load payments"
    });
  }
});

// ===============================
// ADMIN APPROVE PAYMENT
// ===============================
app.post("/api/admin/approve-payment", (req, res) => {
  try {

    const {
      paymentID,
      phone
    } = req.body;

    if (!paymentID || !phone) {
      return res.status(400).json({
        status: "ERROR",
        message:
          "Payment ID and phone number are required"
      });
    }

    const payments =
      readJSON(paymentsFile);

    const payment =
      payments.find(
        item => item.id === paymentID
      );

    if (!payment) {
      return res.status(404).json({
        status: "ERROR",
        message: "Payment not found"
      });
    }

    if (payment.status !== "PENDING") {
      return res.status(400).json({
        status: "ERROR",
        message:
          "Payment has already been processed"
      });
    }

    const wallets =
      readJSON(walletsFile);

    let wallet =
      wallets.find(
        item => item.phone === phone
      );

    if (!wallet) {

      wallet = {
        phone: phone,
        balance: 0,
        createdAt:
          new Date().toISOString()
      };

      wallets.push(wallet);
    }

    wallet.balance =
      Number(wallet.balance) +
      Number(payment.amount);

    payment.status =
      "APPROVED";

    payment.approvedAt =
      new Date().toISOString();

    payment.userPhone =
      phone;

    const transactions =
      readJSON(transactionsFile);

    transactions.push({
      id:
        "TXN" +
        Date.now(),

      phone:
        phone,

      type:
        "WALLET_FUND",

      amount:
        Number(payment.amount),

      reference:
        payment.reference,

      paymentID:
        payment.id,

      status:
        "SUCCESS",

      createdAt:
        new Date().toISOString()
    });

    saveJSON(
      walletsFile,
      wallets
    );

    saveJSON(
      paymentsFile,
      payments
    );

    saveJSON(
      transactionsFile,
      transactions
    );

    res.json({
      status: "SUCCESS",
      message:
        "Payment approved and wallet funded",
      phone:
        phone,
      balance:
        Number(wallet.balance).toFixed(2)
    });

  } catch (error) {

    console.error(
      "APPROVE PAYMENT ERROR:",
      error
    );

    res.status(500).json({
      status: "ERROR",
      message:
        "Unable to approve payment"
    });
  }
});
// ===============================
// TRANSACTION HISTORY
// ===============================
app.get("/api/transactions", (req, res) => {
  try {

    const phone =
      String(req.query.phone || "").trim();

    if (!/^0\d{10}$/.test(phone)) {
      return res.status(400).json({
        status: "ERROR",
        message: "Valid phone number is required"
      });
    }

    const transactions =
      readJSON(transactionsFile);

    const userTransactions =
      transactions
        .filter(item => item.phone === phone)
        .sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );

    res.json({
      status: "SUCCESS",
      phone: phone,
      transactions: userTransactions
    });

  } catch (error) {

    console.error(
      "TRANSACTIONS ERROR:",
      error
    );

    res.status(500).json({
      status: "ERROR",
      message: "Unable to load transactions"
    });
  }
});
