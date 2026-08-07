// Dashboard cards
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    const title = card.querySelector("h3");

    if (!title) return;

    const service = title.textContent.trim();

    if (service === "Buy Data") {
      window.location.href = "buydata.html";
      return;
    }

    alert("Ka zaɓi: " + service);
  });
});


// Fund Wallet button
const walletButton = document.querySelector(".wallet button");

if (walletButton) {
  walletButton.addEventListener("click", () => {
    alert("Fund Wallet feature yana zuwa nan ba da jimawa ba.");
  });
}


// Buy Data
function buyData() {
  const network = document.getElementById("network");
  const phone = document.querySelector('input[type="tel"]');
  const plan = document.getElementById("plan");

  if (!network || !phone || !plan) return;

  if (phone.value.trim() === "") {
    alert("Da fatan saka lambar waya.");
    return;
  }

  alert(
    "Za a sayi " +
    plan.options[plan.selectedIndex].text +
    " zuwa " +
    phone.value +
    " na " +
    network.value
  );
}


// Update Amount
document.addEventListener("DOMContentLoaded", () => {
  const plan = document.getElementById("plan");
  const amount = document.querySelector(".amount h2");

  if (!plan || !amount) return;

  function updateAmount() {
    amount.textContent = "₦" + plan.value;
  }

  updateAmount();

  plan.addEventListener("change", updateAmount);
});
