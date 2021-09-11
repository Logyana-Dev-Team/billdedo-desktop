const database = require("./js/database");

window.onload = function () {
  // Populate the table
  // populateTable();

  // Add the add button click event
  document.getElementById("add").addEventListener("click", () => {
    // Retrieve the input fields
    var productName = document.getElementById("categoryName");
    console.log("Hi");

    // Save the person in the database
    database.addCategory(productName.value);

    // Reset the input fields
    productName.value = "";

    // Repopulate the table
    populateTable();
  });
};
