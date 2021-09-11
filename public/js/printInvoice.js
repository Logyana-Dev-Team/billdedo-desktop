$.getScript("js/tableToJSON.js");

$("#cashPrint").click(function () {
  const no = $("#customerNoCash").val();
  const name = $("#customerNameCash").val();

  var items = printInvoice();
  itemTable = JSON.stringify(items);
  var subtotal = subtotalTable();
  totalTable = JSON.stringify(subtotal);
  $.ajax({
    url: "/createInvoice",
    method: "post",
    dataType: "json",
    data: {
      items: items,
      total: subtotal,
      custName: name,
      custNo: no,
      paymentMode: "Cash",
    },
    beforeSend: function () {},
    success: function (response) {
      printPage();
    },
    error: function (response) {
      alert("server error occured");
    },
  });
});

$("#cardPrint").click(function () {
  const no = $("#customerNoCard").val();
  const name = $("#customerNameCard").val();

  var items = printInvoice();
  itemTable = JSON.stringify(items);
  var subtotal = subtotalTable();
  totalTable = JSON.stringify(subtotal);
  $.ajax({
    url: "/createInvoice",
    method: "post",
    dataType: "json",
    data: {
      items: items,
      total: subtotal,
      custName: name,
      custNo: no,
      paymentMode: "Card",
    },
    beforeSend: function () {},
    success: function (response) {
      printPage();
    },
    error: function (response) {
      // alert("server error occured");
    },
  });
});

$("#onlinePrint").click(function () {
  const no = $("#customerNoOn").val();
  const name = $("#customerNameOn").val();

  var items = printInvoice();
  itemTable = JSON.stringify(items);
  var subtotal = subtotalTable();
  totalTable = JSON.stringify(subtotal);
  $.ajax({
    url: "/createInvoice",
    method: "post",
    dataType: "json",
    data: {
      items: items,
      total: subtotal,
      custName: name,
      custNo: no,
      paymentMode: "Online",
    },
    beforeSend: function () {},
    success: function (response) {
      printPage();
    },
    error: function (response) {
      // alert("server error occured");
    },
  });
});

function printInvoice() {
  var table = $("#invoiceTable").tableToJSON({
    ignoreEmptyRows: true,
    includeRowId: true,
    ignoreColumns: [0, 6],
    headings: ["itemName", "quantity", "pricePerUnit", "gst", "amount"],
  });
  console.log(table);
  return table;
}

function subtotalTable() {
  var table = $("#subtotalTable").tableToJSON({
    ignoreColumns: [0],
    headings: ["subtotal", "gst", "roundOff", "discount", "total"],
    extractor: function (cellIndex, $cell) {
      const type = $cell.find("select").val();

      if (type === "₹") {
        return (
          $cell.find("select").val() + $cell.find("input").val() || $cell.text()
        );
      } else {
        return (
          $cell.find("input").val() + $cell.find("select").val() || $cell.text()
        );
      }
    },
  });
  return table;
}

function printPage() {
  var div = document.getElementById("printerDiv");
  div.innerHTML =
    '<iframe src="/invoice" onload="this.contentWindow.print();"></iframe>';
}
