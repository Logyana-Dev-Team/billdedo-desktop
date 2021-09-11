const database = require("./js/database");

// Populates the persons table
window.onload = function () {
  // Retrieve the persons
  database.getProducts(function (product) {
    // Generate the table body
    var tableBody = "";
    for (i = 0; i < product.length; i++) {
      tableBody += "<tr>";
      tableBody += "  <td>" + product[i].productName + "</td>";
      tableBody += "  <td>" + product[i].productCatagory + "</td>";
      tableBody += "  <td>" + product[i].productPrice + "</td>";
      tableBody += "  <td>" + product[i].productUnit + "</td>";
      tableBody += "  <td>" + product[i].productDescription + "</td>";
      tableBody += "</tr>";
    }

    // Fill the table content
    document.getElementById("tablebody").innerHTML = tableBody;
  });
};
