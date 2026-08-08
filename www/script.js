// =====================================
// BSR DATA
// =====================================

let plansData = {};


// =====================================
// PAGE READY
// =====================================

document.addEventListener("DOMContentLoaded", () => {

  loadPlans();

  const network = document.getElementById("network");

  if (network) {
    network.addEventListener("change", () => {
      showPlans(network.value);
    });
  }

});


// =====================================
// LOAD DATA PLANS
// =====================================

async function loadPlans() {

  const plan = document.getElementById("plan");

  if (!plan) return;

  plan.innerHTML =
    '<option value="">Loading plans...</option>';

  try {

    const response = await fetch(
      "http://127.0.0.1:3000/api/plans"
    );

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    if (!data.MOBILE_NETWORK) {
      throw new Error("MOBILE_NETWORK missing");
    }

    plansData = data;

    const network =
      document.getElementById("network");

    showPlans(
      network ? network.value : "MTN"
    );

  } catch (error) {

    console.error("LOAD PLANS ERROR:", error);

    plan.innerHTML =
      '<option value="">Failed to load plans</option>';

    const amount =
      document.getElementById("amount");

    if (amount) {
      amount.textContent = "₦0";
    }

  }
}


// =====================================
// SHOW PLANS
// =====================================

function showPlans(network) {

  const plan =
    document.getElementById("plan");

  const amount =
    document.getElementById("amount");

  if (!plan) return;

  plan.innerHTML = "";

  const networkPlans =
    plansData.MOBILE_NETWORK?.[network];

  if (!networkPlans || !networkPlans.length) {

    plan.innerHTML =
      '<option value="">No plans available</option>';

    if (amount) {
      amount.textContent = "₦0";
    }

    return;
  }

  const products =
    networkPlans[0].PRODUCT || [];

  if (!products.length) {

    plan.innerHTML =
      '<option value="">No plans available</option>';

    return;
  }

  products.forEach(product => {

    const option =
      document.createElement("option");

    option.value =
      product.PRODUCT_ID;

    option.dataset.code =
      product.PRODUCT_CODE;

    option.dataset.price =
      product.PRODUCT_AMOUNT;

    option.textContent =
      `${product.PRODUCT_NAME} - ₦${formatAmount(
        product.PRODUCT_AMOUNT
      )}`;

    plan.appendChild(option);

  });

  updateAmount();

}


// =====================================
// PLAN CHANGE
// =====================================

document.addEventListener("change", event => {

  if (event.target.id === "plan") {
    updateAmount();
  }

});


// =====================================
// UPDATE AMOUNT
// =====================================

function updateAmount() {

  const plan =
    document.getElementById("plan");

  const amount =
    document.getElementById("amount");

  if (!plan || !amount) return;

  const selected =
    plan.options[plan.selectedIndex];

  if (!selected ||
      !selected.dataset.price) {

    amount.textContent = "₦0";

    return;
  }

  amount.textContent =
    "₦" +
    formatAmount(selected.dataset.price);

}


// =====================================
// FORMAT MONEY
// =====================================

function formatAmount(value) {

  const number =
    Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return Math.round(number)
    .toLocaleString("en-NG");

}


// =====================================
// BUY DATA
// =====================================

async function buyData() {

  const networkElement =
    document.getElementById("network");

  const phoneElement =
    document.getElementById("phone");

  const planElement =
    document.getElementById("plan");

  const buyBtn =
    document.getElementById("buyBtn");


  if (!networkElement ||
      !phoneElement ||
      !planElement) {

    alert("An samu matsala da form.");

    return;
  }


  const network =
    networkElement.value;

  const phone =
    phoneElement.value.trim();


  if (!phone) {

    alert(
      "Da fatan saka lambar waya."
    );

    return;
  }


  if (!/^0\d{10}$/.test(phone)) {

    alert(
      "Lambar waya ba daidai ba ce.\n" +
      "Misali: 08012345678"
    );

    return;
  }


  if (!planElement.value) {

    alert(
      "Da fatan zaɓi Data Plan."
    );

    return;
  }


  const selected =
    planElement.options[
      planElement.selectedIndex
    ];


  const planId =
    selected.value;

  const productCode =
    selected.dataset.code || "";

  const price =
    selected.dataset.price || "0";


  const confirmBuy = confirm(

    `Network: ${network}\n` +
    `Phone: ${phone}\n` +
    `Plan: ${selected.textContent}\n` +
    `Product ID: ${planId}\n\n` +
    `Amount: ₦${formatAmount(price)}\n\n` +
    `Kana son ci gaba?`

  );


  if (!confirmBuy) {
    return;
  }


  if (buyBtn) {

    buyBtn.disabled = true;
    buyBtn.textContent =
      "PROCESSING...";

  }


  try {

    const response =
      await fetch(
        "http://127.0.0.1:3000/api/buydata",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            network: network,

            phone: phone,

            plan: planId

          })

        }
      );


    const result =
      await response.json();


    console.log(
      "BUY DATA RESPONSE:",
      result
    );


    if (!response.ok) {

      throw new Error(
        result.message ||
        "Buy request failed"
      );

    }


    if (
      result.status ===
        "ORDER_RECEIVED" ||

      result.status ===
        "ORDER_COMPLETED"
    ) {

      alert(

        "✅ An karɓi order ɗinka.\n\n" +

        "Request ID: " +
        (result.requestID || "N/A") +

        "\n\nStatus: " +
        (result.status || "UNKNOWN")

      );

    } else {

      alert(

        "Order bai yi nasara ba.\n\n" +

        "Status: " +
        (result.status || "UNKNOWN") +

        "\n\n" +

        (
          result.remark ||
          result.message ||
          "Ba a samu ƙarin bayani ba."
        )

      );

    }


  } catch (error) {

    console.error(
      "BUY DATA ERROR:",
      error
    );

    alert(
      "An samu matsala wajen haɗa BSR DATA da server.\n\n" +
      error.message
    );

  } finally {

    if (buyBtn) {

      buyBtn.disabled = false;

      buyBtn.textContent =
        "BUY NOW";

    }

  }

}
