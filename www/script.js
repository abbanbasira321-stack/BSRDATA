document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    const service = card.querySelector("h3").textContent;
    alert("Ka zaɓi: " + service);
  });
});

document.querySelector(".wallet button").addEventListener("click", () => {
  alert("Fund Wallet feature yana zuwa nan ba da jimawa ba.");
});
function buyData() {
  alert("Buy Data feature will be connected to ClubKonnect API soon.");
}

document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const title = card.querySelector("h3");

    if (title && title.textContent.trim() === "Buy Data") {
      card.onclick = function () {
        window.location.href = "buydata.html";
      };
    }
  });
});
