function createInvoice(id, name, price, gststat, taxclass) {
  var target = $("." + id + "itemQuantity", this.parentNode)[0];
  var gst1 = $("." + id + "gst", this.parentNode)[0];
  var totalAmout = $("." + id + "totalAmout", this.parentNode)[0];
  const tc = taxclass;
  if ($("#invoiceTable tbody").length == 0) {
    $("#invoiceTable").append("<tbody></tbody>");
  }
  percentage = parseInt(tc.split(" ")[1]);
  gst = (percentage / 100) * price;
  if (gststat === "gstIncluded") {
    var price6 = price - gst;
  } else if (gststat === "gstExcluded") {
    var price6 = price;
    price = parseFloat(price) + parseFloat(gst);
  }
  if ($("#invoiceTable td:contains(" + name + ")").length == 1) {
    target.innerHTML = +target.innerHTML + 1;
    var amount = price6 * parseInt(target.innerHTML);
    gst1.innerHTML = (parseFloat(gst1.innerHTML) + parseFloat(gst)).toFixed(2);
    var allTotal = (amount + parseFloat(gst1.innerHTML)).toFixed(2);
    totalAmout.innerHTML = parseFloat(allTotal);
  } else {
    $("#invoiceTable tbody").append(
      "<tr class=" +
        id +
        " id=" +
        id +
        ">" +
        "<td style='font-weight: bold;'>" +
        "</td>" +
        "<td>" +
        name +
        "</td>" +
        "<td class='" +
        id +
        "itemQuantity'>" +
        1 +
        "</td>" +
        "<td>" +
        "₹ " +
        "<span class='" +
        id +
        "itemPrice total'>" +
        parseFloat(price6).toFixed(2) +
        "</span>" +
        "</td>" +
        "<td>" +
        "₹ " +
        "<span class='" +
        id +
        "gst totgst'>" +
        gst +
        "</span>" +
        " (" +
        percentage +
        "%)" +
        "</td>" +
        "<td>" +
        "₹ " +
        "<span class='" +
        id +
        "totalAmout grand'>" +
        parseFloat(price).toFixed(2) +
        "</span>" +
        "</td>" +
        "<td>" +
        '<a onclick="return removeProduct(this)"><i class="fas fa-trash"></i></a>' +
        "</td>" +
        "</tr>"
    );
  }
  calculateTotal();
}

function removeProduct(ctl) {
  $(ctl).parents("tr").remove();
  calculateTotal();
}

function calculateTotal() {
  var subtotal = $("#subtotal");
  var IGST = $("#IGST");
  var roundOff = $("#roundOff");
  var grandTotal = $("#grandTotal");
  var grTotal = 0;

  $("#invoiceTable .grand").each(function () {
    grTotal += Number($(this).text());
  });
  grandTotal.html(grTotal.toLocaleString("en-IN").split(".")[0]);

  var stotal = 0;
  $("#invoiceTable .total").each(function () {
    stotal += Number($(this).text());
  });
  subtotal.html(stotal.toLocaleString("en-IN"));

  var totalgst = 0;
  $("#invoiceTable .totgst").each(function () {
    totalgst += Number($(this).text());
  });
  IGST.html(totalgst.toLocaleString("en-IN"));

  const round = grTotal.toFixed(2);

  const roundOffString = round.toString().split(".")[1];

  roundOff.html("00." + roundOffString);
  $("#discount").on("input", function () {
    const discount = $("#discount").val();
    const type = $("#selectDiscount").val();
    var totalDiscount = 0;
    if (type === "₹") {
      totalDiscount = grTotal - discount;
      grandTotal.html(totalDiscount.toLocaleString("en-IN").split(".")[0]);
    } else if (type === "%") {
      const perc = discount / 100;
      totalDiscount = grTotal - grTotal * perc;
      grandTotal.html(totalDiscount.toLocaleString("en-IN").split(".")[0]);
    }
  });

  $("#selectDiscount").on("change", () => {
    const discount = $("#discount").val();
    const type = $("#selectDiscount").val();
    var totalDiscount = 0;
    if (discount) {
      if (type === "₹") {
        totalDiscount = grTotal - discount;
        grandTotal.html(totalDiscount.toLocaleString("en-IN").split(".")[0]);
      } else if (type === "%") {
        const perc = discount / 100;
        totalDiscount = grTotal - grTotal * perc;
        grandTotal.html(totalDiscount.toLocaleString("en-IN").split(".")[0]);
      }
    }
  });
}
