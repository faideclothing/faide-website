const modal = document.getElementById("product-modal");
const closeModal = document.getElementById("close-modal");

document.querySelectorAll(".view-product").forEach(btn => {
  btn.addEventListener("click", () => {
    modal.style.display = "flex";
  });
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});
