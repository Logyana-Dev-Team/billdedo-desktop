const database = require("./js/database");

window.onload = function () {
  // Populate the table
  // populateTable();

  // Add the add button click event
  document.getElementById("add").addEventListener("click", () => {
    // Retrieve the input fields
    var productName = document.getElementById("productName");
    var productCatagory = document.getElementById("productCatagory");
    var productPrice = document.getElementById("productPrice");
    var productUnit = document.getElementById("productUnit");
    var productDescription = document.getElementById("productDescription");
    console.log("Hi");

    // Save the person in the database
    database.addproduct(
      productName.value,
      productCatagory.value,
      productPrice.value,
      productUnit.value,
      productDescription.value
    );

    // Reset the input fields
    productName.value = "";
    productCatagory.value = "";
    productPrice.value = "";
    productUnit.value = "";
    productDescription.value = "";

    // Repopulate the table
    populateTable();
    populateCategory();
  });
};

function populateCategory() {
  database.getCategory(function (category) {
    var productCatagory = "";
    for (i = 0; i < category.length; i++) {
      productCatagory += "<option selected>Select Product Catagory</option>";
      productCatagory += "<option>" + category[i].categoryName + "</option>";
    }
    document.getElementById("productCatagory").innerHTML = productCatagory;
  });
}
