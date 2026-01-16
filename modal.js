const modal = document.getElementById("product-modal");
const closeModal = document.querySelector(".close-modal");

document.querySelectorAll(".preview-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const product = e.target.closest(".product");
    document.getElementById("modal-img").src = product.dataset.img;
    document.getElementById("modal-name").textContent = product.dataset.name;
    document.getElementById("modal-description").textContent = product.dataset.description;
    document.getElementById("modal-price").textContent = "R" + product.dataset.price;
    modal.style.display = "flex";
  });
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});
