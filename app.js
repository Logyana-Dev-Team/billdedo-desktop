const { dialog } = require("electron");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const multer = require("multer");
const shortid = require("shortid");
const { Parser } = require("json2csv");
const csvtojson = require("csvtojson");
const fs = require("fs");
const fse = require("fs-extra");
const { debugPort } = require("process");

db = new Datastore({
  filename: "db/product.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

shop = new Datastore({
  filename: "db/shop.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

PcDb = new Datastore({
  filename: "db/productCategory.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

itemDb = new Datastore({
  filename: "db/items.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

totalDb = new Datastore({
  filename: "db/total.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

taxDb = new Datastore({
  filename: "db/tax.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

invoiceDb = new Datastore({
  filename: "db/invoice.db",
  autoload: true,
  corruptAlertThreshold: 1,
  timestampData: { createdAt: "createdAt", updatedAt: "updatedAt" },
});

printerDb = new Datastore({
  filename: "db/printerSize.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

customerDb = new Datastore({
  filename: "db/customer.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

tempCustomerDb = new Datastore({
  filename: "db/tempCustomerDb.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

productSampleDb = new Datastore({
  filename: "db/productSampleDb.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

categorySampleDb = new Datastore({
  filename: "db/categorySampleDb.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

supplierDb = new Datastore({
  filename: "db/supplierDb.db",
  autoload: true,
  corruptAlertThreshold: 1,
});

const app = express();

// Require static assets from public folder
app.use(express.static(path.join(__dirname, "public")));

// Set 'views' directory for any views
// being rendered res.render()
app.set("views", path.join(__dirname, "views"));

// Set view engine as EJS
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/public/img");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype == "image/jpeg" || file.mimetype == "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

app.get("/", async function (req, res) {
  db.find({}, function (err, product) {
    if (err) {
      console.log(err);
    } else {
      PcDb.find({}, function (err, category) {
        if (err) {
          console.log(err);
        } else {
          shop.find({}, function (err, shop) {
            if (err) {
              console.log(err);
            } else {
              customerDb.find({}, function (err, customer) {
                if (err) {
                  console.log(err);
                } else {
                  res.render("index.ejs", {
                    products: product,
                    categories: category,
                    shop: shop,
                    customer: customer,
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});

app.get("/addCategory", function (req, res) {
  res.render("addCategory.ejs");
});

app.get("/addStore", function (req, res) {
  shop.find({}, function (err, shop) {
    if (err) {
      console.log(err);
    } else {
      res.render("addStore.ejs", {
        shop: shop,
      });
    }
  });
});

app.post("/createInvoice", async (req, res) => {
  const data = req.body;
  const items = data.items;
  const total = data.total;
  const name = data.custName;
  const no = data.custNo;
  const mode = data.paymentMode;
  const id = shortid.generate();

  const discountType = total[3].subtotal;

  if (discountType.slice(0, 1) === "₹") {
    var discount = discountType.slice(0, 1) + " " + discountType.slice(1);
  } else {
    var discount = discountType;
  }

  const invoiceItems = items.map((item, index) => {
    return item;
  });

  const tempCustomer = {
    id: id,
    name: name,
    no: no,
  };

  const obj = {
    subtotal: total[0].subtotal,
    gst: total[1].subtotal,
    roundOff: total[2].subtotal,
    discount: discount,
    total: total[4].subtotal,
  };

  const invoice = {
    id: id,
    custName: name,
    custNo: no,
    invoiceItems: invoiceItems,
    subtotal: obj,
    paymentMode: mode,
  };

  itemDb.insert(invoiceItems, function (err, newDoc) {
    if (err) {
      console.log(err);
    } else {
      totalDb.insert(obj, (err, newTotal) => {
        if (err) {
          console.log(err);
        } else {
          tempCustomerDb.insert(tempCustomer, (err, tempCustomer) => {
            if (err) {
              console.log(err);
            } else {
              invoiceDb.insert(invoice, (err, invoice) => {
                if (err) {
                  console.log(err);
                } else {
                  const insertCustomer = {
                    id: id,
                    name: name,
                    no: no,
                    invoiceId: [invoice.id],
                  };
                  customerDb.find(
                    { no: { $in: [invoice.custNo] } },
                    (err, customer) => {
                      if (customer && customer.length) {
                        customerDb.update(
                          { no: invoice.custNo },
                          { $push: { invoiceId: invoice.id } },
                          function (err, newDoc) {
                            if (err) {
                              res.json({ msg: "error" });
                            } else {
                              res.json({ msg: "success" });
                              invoiceItems.forEach((element) => {
                                const id = element.rowId;
                                const unit = element.quantity;
                                db.find({ _id: id }, (err, product) => {
                                  if (err) {
                                    console.log(err);
                                  } else {
                                    const invoiceUnit = parseInt(unit);
                                    const prodUnit = product[0].productUnit;
                                    const finalUnit = (
                                      prodUnit - invoiceUnit
                                    ).toString();
                                    const update = {
                                      productUnit: finalUnit,
                                    };
                                    db.update(
                                      { _id: id },
                                      { $set: update },
                                      (err) => {
                                        if (err) {
                                          console.log(err);
                                        }
                                        db.persistence.compactDatafile();
                                      }
                                    );
                                  }
                                });
                              });
                            }
                            customerDb.persistence.compactDatafile();
                          }
                        );
                      } else {
                        customerDb.insert(insertCustomer, (err, invoice) => {
                          if (err) {
                            res.json({ msg: "error" });
                          } else {
                            res.json({ msg: "success" });
                            invoiceItems.forEach((element) => {
                              const id = element.rowId;
                              const unit = element.quantity;
                              db.find({ _id: id }, (err, product) => {
                                if (err) {
                                  console.log(err);
                                } else {
                                  const invoiceUnit = parseInt(unit);
                                  const prodUnit = product[0].productUnit;
                                  const finalUnit = (
                                    prodUnit - invoiceUnit
                                  ).toString();
                                  const update = {
                                    productUnit: finalUnit,
                                  };
                                  db.update(
                                    { _id: id },
                                    { $set: update },
                                    (err) => {
                                      if (err) {
                                        console.log(err);
                                      }
                                      db.persistence.compactDatafile();
                                    }
                                  );
                                }
                              });
                            });
                          }
                        });
                      }
                    }
                  );
                }
              });
            }
          });
        }
      });
    }
  });
});

app.post("/invoiceCsv", (req, res) => {
  const fields = [
    "id",
    "custName",
    "custNo",
    "invoiceItems",
    "subtotal",
    "paymentMode",
    "createdAt",
  ];
  const opts = { fields };
  invoiceDb.find({}, (err, invoice) => {
    if (err) {
      console.log(err);
    } else {
      try {
        const parser = new Parser(opts);
        const csv = parser.parse(invoice);
        dialog
          .showSaveDialog({
            title: "Save file",
            filters: [{ name: "CSV files", extensions: ["csv"] }],
            defaultPath: "Invoice.csv",
          })
          .then((result) => {
            fs.writeFile(result.filePath, csv, (err, buf) => {
              if (err) {
                res.json({ msg: "error" });
              } else {
                res.json({ msg: "success" });
              }
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {
        console.error(err);
      }
    }
  });
});

app.post("/productCsv", (req, res) => {
  const fields = [
    "imageName",
    "productName",
    "productCatagory",
    "productPrice",
    "gst",
    "selectTaxClass",
    "productAvgUnit",
    "productUnit",
    "productDescription",
  ];
  const opts = { fields };
  db.find({}, (err, products) => {
    if (err) {
      console.log(err);
    } else {
      try {
        const parser = new Parser(opts);
        const csv = parser.parse(products);
        dialog
          .showSaveDialog({
            title: "Save file",
            filters: [{ name: "CSV files", extensions: ["csv"] }],
            defaultPath: "Product.csv",
          })
          .then((result) => {
            fs.writeFile(result.filePath, csv, (err, buf) => {
              if (err) {
                res.json({ msg: "error" });
              } else {
                res.json({ msg: "success" });
              }
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {
        console.error(err);
      }
    }
  });
});

app.post("/supplierCsv", (req, res) => {
  const fields = [
    "supplierName",
    "supplierMob",
    "supplierEmail",
    "supplierPhone",
    "supplierGstNumber",
    "state",
    "city",
    "postcode",
    "address",
  ];
  const opts = { fields };
  supplierDb.find({}, (err, products) => {
    if (err) {
      console.log(err);
    } else {
      try {
        const parser = new Parser(opts);
        const csv = parser.parse(products);
        dialog
          .showSaveDialog({
            title: "Save file",
            filters: [{ name: "CSV files", extensions: ["csv"] }],
            defaultPath: "Suppliers.csv",
          })
          .then((result) => {
            fs.writeFile(result.filePath, csv, (err, buf) => {
              if (err) {
                res.json({ msg: "error" });
              } else {
                res.json({ msg: "success" });
              }
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {
        console.error(err);
      }
    }
  });
});

app.post("/customerCsv", (req, res) => {
  const fields = ["name", "no", "invoiceId"];
  const opts = { fields };
  customerDb.find({}, (err, products) => {
    if (err) {
      console.log(err);
    } else {
      try {
        const parser = new Parser(opts);
        const csv = parser.parse(products);
        dialog
          .showSaveDialog({
            title: "Save file",
            filters: [{ name: "CSV files", extensions: ["csv"] }],
            defaultPath: "Customers.csv",
          })
          .then((result) => {
            fs.writeFile(result.filePath, csv, (err, buf) => {
              if (err) {
                res.json({ msg: "error" });
              } else {
                res.json({ msg: "success" });
              }
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {
        console.error(err);
      }
    }
  });
});

app.post("/productSample", (req, res) => {
  const fields = [
    "imageName",
    "productName",
    "productCatagory",
    "productPrice",
    "gst",
    "selectTaxClass",
    "productAvgUnit",
    "productUnit",
    "productDescription",
  ];
  const opts = { fields };
  productSampleDb.find({}, (err, products) => {
    if (err) {
      console.log(err);
    } else {
      try {
        const parser = new Parser(opts);
        const csv = parser.parse(products);
        dialog
          .showSaveDialog({
            title: "Save file",
            filters: [{ name: "CSV files", extensions: ["csv"] }],
            defaultPath: "Product Sample.csv",
          })
          .then((result) => {
            fs.writeFile(result.filePath, csv, (err, buf) => {
              if (err) {
                res.json({ msg: "error" });
              } else {
                res.json({ msg: "success" });
              }
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {
        console.error(err);
      }
    }
  });
});

app.post("/categoryCsv", (req, res) => {
  const fields = ["imageName", "categoryName"];
  const opts = { fields };
  PcDb.find({}, (err, categories) => {
    if (err) {
      console.log(err);
    } else {
      try {
        const parser = new Parser(opts);
        const csv = parser.parse(categories);
        dialog
          .showSaveDialog({
            title: "Save file",
            filters: [{ name: "CSV files", extensions: ["csv"] }],
            defaultPath: "Categories.csv",
          })
          .then((result) => {
            fs.writeFile(result.filePath, csv, (err, buf) => {
              if (err) {
                res.json({ msg: "error" });
              } else {
                res.json({ msg: "success" });
              }
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {
        console.error(err);
      }
    }
  });
});

app.post("/categorySample", (req, res) => {
  const fields = ["imageName", "categoryName"];
  const opts = { fields };
  categorySampleDb.find({}, (err, categories) => {
    if (err) {
      console.log(err);
    } else {
      try {
        const parser = new Parser(opts);
        const csv = parser.parse(categories);
        dialog
          .showSaveDialog({
            title: "Save file",
            filters: [{ name: "CSV files", extensions: ["csv"] }],
            defaultPath: "Category Sample.csv",
          })
          .then((result) => {
            fs.writeFile(result.filePath, csv, (err, buf) => {
              if (err) {
                res.json({ msg: "error" });
              } else {
                res.json({ msg: "success" });
              }
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (err) {
        console.error(err);
      }
    }
  });
});

app.post("/productImport", (req, res) => {
  dialog
    .showOpenDialog({
      title: "Open file",
      filters: [{ name: "CSV files", extensions: ["csv"] }],
      properties: ["openFile"],
    })
    .then((result) => {
      const path = result.filePaths.toString();
      csvtojson()
        .fromFile(path)
        .then((products) => {
          db.insert(products, function (err, newDoc) {
            if (err) {
              res.json({ msg: "error" });
            } else {
              res.json({ msg: "success" });
            }
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/imagesImport", (req, res) => {
  dialog
    .showOpenDialog({
      title: "Open file",
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }],
      properties: ["openFile", "multiSelections"],
    })
    .then((result) => {
      const paths = result.filePaths;
      paths.forEach((filepath) => {
        const filename = path.basename(filepath);
        fse
          .copy(filepath, __dirname + "/public/img/" + filename)
          .then(() => {})
          .catch((err) => {
            console.error(err);
            res.json({ msg: "error" });
          });
      });
      res.json({ msg: "success" });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/categoryImport", (req, res) => {
  dialog
    .showOpenDialog({
      title: "Open file",
      filters: [{ name: "CSV files", extensions: ["csv"] }],
      properties: ["openFile"],
    })
    .then((result) => {
      const path = result.filePaths.toString();
      csvtojson()
        .fromFile(path)
        .then((products) => {
          PcDb.insert(products, function (err, newDoc) {
            if (err) {
              res.json({ msg: "error" });
            } else {
              res.json({ msg: "success" });
            }
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/invoice", async (req, res) => {
  const date = new Date();
  var dd = date.getDate();
  var mm = date.getMonth() + 1;
  var yyyy = date.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  const today = dd + "/" + mm + "/" + yyyy;

  shop.find({}, (err, shop) => {
    if (err) {
      console.log(err);
    } else {
      itemDb.find({ $not: { itemName: "Item Name" } }, (err, cart) => {
        if (err) {
          console.log(err);
        } else {
          totalDb.find({}, (err, total) => {
            if (err) {
              console.log(err);
            } else {
              printerDb.findOne({ _id: "size" }, (err, docs) => {
                if (err) {
                  console.log(err);
                } else {
                  tempCustomerDb.find({}, (err, customer) => {
                    if (err) {
                      console.log(err);
                    } else {
                      const printer = docs.printerSize;
                      if (printer === "Small size(Thermal Printer)") {
                        res.render("smallInvoice.ejs", {
                          customer: customer,
                          shop: shop,
                          items: cart,
                          total: total,
                          date: today,
                        });
                      } else if (printer === "Full Size A4") {
                        res.render("invoice.ejs", {
                          customer: customer,
                          shop: shop,
                          items: cart,
                          total: total,
                          date: today,
                        });
                      }
                    }
                  });
                  itemDb.remove(
                    {},
                    { multi: true },
                    function (err, numRemoved) {}
                  );
                  tempCustomerDb.remove(
                    {},
                    { multi: true },
                    function (err, numRemoved) {}
                  );
                  totalDb.remove(
                    {},
                    { multi: true },
                    function (err, numRemoved) {}
                  );
                  itemDb.persistence.compactDatafile();
                  totalDb.persistence.compactDatafile();
                  tempCustomerDb.persistence.compactDatafile();
                }
              });
            }
          });
        }
      });
    }
  });
});

app.get("/addTaxClass", (req, res) => {
  res.render("addTaxClass.ejs");
});

app.get("/editProduct/:id", (req, res) => {
  const productId = req.params.id;
  db.findOne({ _id: productId }, (err, product) => {
    if (err) {
      console.log(err);
      res.json({ msg: "error" });
    } else {
      PcDb.find({}, function (err, category) {
        if (err) {
          console.log(err);
        } else {
          taxDb.find({}, function (err, taxClass) {
            if (err) {
              console.log(err);
            } else {
              res.render("editProduct.ejs", {
                product: product,
                category: category,
                taxClass: taxClass,
              });
            }
          });
        }
      });
    }
  });
});

app.get("/viewCustomer/:id", (req, res) => {
  const date = new Date();
  var dd = date.getDate();
  var mm = date.getMonth() + 1;
  var yyyy = date.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  const today = dd + "/" + mm + "/" + yyyy;
  const customerId = req.params.id;
  customerDb.findOne({ _id: customerId }, (err, customer) => {
    invoiceDb.find({ id: { $in: customer.invoiceId } }, (err, invoices) => {
      shop.find({}, (err, shop) => {
        res.render("viewCustomer.ejs", {
          invoices: invoices,
          customers: customer,
          shop: shop,
          date: today,
        });
      });
    });
  });
});

app.get("/editSupplier/:id", (req, res) => {
  const supplierId = req.params.id;
  supplierDb.findOne({ _id: supplierId }, (err, supplier) => {
    res.render("editSupplier.ejs", {
      supplier: supplier,
    });
  });
});

app.get("/editCategory/:id", (req, res) => {
  const categoryId = req.params.id;
  PcDb.findOne({ _id: categoryId }, function (err, category) {
    if (err) {
      console.log(err);
    } else {
      res.render("editCategory.ejs", {
        category: category,
      });
    }
  });
});

app.get("/editTax/:id", (req, res) => {
  const categoryId = req.params.id;
  taxDb.findOne({ _id: categoryId }, function (err, tax) {
    if (err) {
      console.log(err);
    } else {
      res.render("editTax.ejs", {
        tax: tax,
      });
    }
  });
});

app.post("/removeProduct", (req, res) => {
  const productId = req.body.productId;
  db.remove({ _id: productId }, {}, function (err, numRemoved) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
      db.persistence.compactDatafile();
    }
  });
});

app.post("/removeCategory", (req, res) => {
  const categoryId = req.body.categoryId;
  PcDb.remove({ _id: categoryId }, {}, function (err, numRemoved) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
      PcDb.persistence.compactDatafile();
    }
  });
});

app.post("/removeTax", (req, res) => {
  const taxId = req.body.taxId;
  taxDb.remove({ _id: taxId }, {}, function (err, numRemoved) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
      taxDb.persistence.compactDatafile();
    }
  });
});

app.post("/removeInvoice", (req, res) => {
  const invoiceId = req.body.invoiceId;
  invoiceDb.remove({ _id: invoiceId }, {}, function (err, numRemoved) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
      invoiceDb.persistence.compactDatafile();
    }
  });
});

app.post("/removeSupplier", (req, res) => {
  const supplierId = req.body.supplierId;
  supplierDb.remove({ _id: supplierId }, {}, function (err, numRemoved) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
      supplier.persistence.compactDatafile();
    }
  });
});

app.post("/removeCustomer", (req, res) => {
  const customerId = req.body.customerId;
  customerDb.remove({ _id: customerId }, {}, function (err, numRemoved) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
      customerDb.persistence.compactDatafile();
    }
  });
});

app.post("/insertCategory", upload.single("image"), function (req, res) {
  image = req.file;
  imageName = image.filename;

  const category = {
    imageName: imageName,
    categoryName: req.body.categoryName,
  };
  PcDb.insert(category, function (err, newDoc) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
    }
  });
});

app.post("/insertTaxClass", (req, res) => {
  const taxClass = { tax: req.body.tax, taxPerc: req.body.taxPerc };
  taxDb.insert(taxClass, (err, docs) => {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
    }
  });
});

app.get("/addProduct", function (req, res) {
  PcDb.find({}, function (err, category) {
    if (err) {
      console.log(err);
    } else {
      taxDb.find({}, function (err, taxClass) {
        if (err) {
          console.log(err);
        } else {
          res.render("addProduct.ejs", {
            category: category,
            taxClass: taxClass,
          });
        }
      });
    }
  });
});

app.get("/addSupplier", function (req, res) {
  res.render("addSupplier.ejs");
});

app.get("/tables", function (req, res) {
  db.find({}, function (err, docs) {
    res.render("tables.ejs", {
      products: docs,
    });
  });
});

app.get("/productStockTable", function (req, res) {
  db.find({}, function (err, docs) {
    res.render("productStockTable.ejs", {
      products: docs,
    });
  });
});

app.get("/categoryTables", function (req, res) {
  PcDb.find({}, function (err, docs) {
    res.render("categoryTables.ejs", {
      category: docs,
    });
  });
});

app.get("/taxTables", function (req, res) {
  taxDb.find({}, function (err, docs) {
    res.render("taxTables.ejs", {
      tax: docs,
    });
  });
});

app.get("/invoiceTable", async function (req, res) {
  const date = new Date();
  var dd = date.getDate();
  var mm = date.getMonth() + 1;
  var yyyy = date.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  const today = dd + "/" + mm + "/" + yyyy;
  invoiceDb.find({}, function (err, docs) {
    shop.find({}, (err, shop) => {
      res.render("invoiceTable.ejs", {
        invoice: docs,
        shop: shop,
        date: today,
      });
    });
  });
});

app.get("/supplierTables", function (req, res) {
  supplierDb.find({}, function (err, docs) {
    res.render("supplierTables.ejs", {
      suppliers: docs,
    });
  });
});

app.get("/customerTable", function (req, res) {
  customerDb.find({}, function (err, docs) {
    res.render("customerTables.ejs", {
      customers: docs,
    });
  });
});

app.post("/insertProduct", upload.single("image"), function (req, res, next) {
  image = req.file;
  imageName = image.filename;

  const product = {
    imageName: imageName,
    productName: req.body.productName,
    productCatagory: req.body.productCatagory,
    productPrice: req.body.productPrice,
    gst: req.body.radio,
    selectTaxClass: req.body.selectTaxClass,
    productUnit: req.body.productUnit,
    productAvgUnit: req.body.productAvgUnit,
    productDescription: req.body.productDescription,
  };

  db.insert(product, function (err, newDoc) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
    }
  });
});

app.post("/addSupplier", (req, res, next) => {
  const supplier = {
    supplierName: req.body.supplierName,
    supplierMob: req.body.supplierMob,
    supplierEmail: req.body.supplierEmail,
    supplierPhone: req.body.supplierPhone,
    supplierGstNumber: req.body.supplierGstNumber,
    state: req.body.stt,
    city: req.body.city,
    postcode: req.body.postcode,
    address: req.body.address,
  };
  supplierDb.insert(supplier, function (err, newDoc) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
    }
  });
});

app.post("/editProduct/:id", function (req, res, next) {
  const productId = req.params.id;
  const product = {
    productName: req.body.productName,
    productCatagory: req.body.productCatagory,
    productPrice: req.body.productPrice,
    productUnit: req.body.productUnit,
    productAvgUnit: req.body.productAvgUnit,
    gst: req.body.radio,
    selectTaxClass: req.body.selectTaxClass,
    productDescription: req.body.productDescription,
  };

  db.update({ _id: productId }, { $set: product }, function (err, newDoc) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
    }
  });
});

app.post(
  "/editProductImage/:id",
  upload.single("image"),
  function (req, res, next) {
    try {
      image = req.file;
      imageName = image.filename;

      const productId = req.params.id;
      const product = {
        imageName: imageName,
      };

      db.update({ _id: productId }, { $set: product }, function (err, newDoc) {
        if (err) {
          res.json({ msg: "error" });
        } else {
          res.json({ msg: "success" });
        }
      });
    } catch (err) {
      res.json({ msg: "error", err: err });
    }
  }
);

app.post(
  "/editShopImage/:id",
  upload.single("image"),
  function (req, res, next) {
    try {
      image = req.file;
      imageName = image.filename;

      const shopId = req.params.id;
      const shopData = {
        imageName: imageName,
      };

      shop.update({ _id: shopId }, { $set: shopData }, function (err, newDoc) {
        if (err) {
          res.json({ msg: "error" });
          console.log(err);
        } else {
          res.json({ msg: "success" });
        }
      });
    } catch (err) {
      res.json({ msg: "error", err: err });
    }
  }
);

app.post("/editCategory/:id", function (req, res, next) {
  const categoryId = req.params.id;
  const category = {
    categoryName: req.body.categoryName,
  };

  PcDb.update({ _id: categoryId }, { $set: category }, function (err, newDoc) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
    }
  });
});

app.post(
  "/editCategoryImage/:id",
  upload.single("image"),
  function (req, res, next) {
    try {
      image = req.file;
      imageName = image.filename;
      const categoryId = req.params.id;
      const category = {
        imageName: imageName,
      };

      PcDb.update(
        { _id: categoryId },
        { $set: category },
        function (err, newDoc) {
          if (err) {
            res.json({ msg: "error" });
          } else {
            res.json({ msg: "success" });
          }
        }
      );
    } catch (error) {
      res.json({ msg: "error", err: error });
    }
  }
);

app.post("/editTaxClass/:id", function (req, res, next) {
  const taxId = req.params.id;
  const tax = {
    tax: req.body.tax,
    taxPerc: req.body.taxPerc,
  };

  taxDb.update({ _id: taxId }, { $set: tax }, function (err, newDoc) {
    if (err) {
      res.json({ msg: "error" });
    } else {
      res.json({ msg: "success" });
    }
  });
});

app.post("/editSupplier/:id", function (req, res, next) {
  const supplierId = req.params.id;
  const supplier = {
    supplierName: req.body.supplierName,
    supplierMob: req.body.supplierMob,
    supplierEmail: req.body.supplierEmail,
    supplierPhone: req.body.supplierPhone,
    supplierGstNumber: req.body.supplierGstNumber,
    state: req.body.stt,
    city: req.body.city,
    postcode: req.body.postcode,
    address: req.body.address,
  };

  supplierDb.update(
    { _id: supplierId },
    { $set: supplier },
    function (err, newDoc) {
      if (err) {
        res.json({ msg: "error" });
      } else {
        res.json({ msg: "success" });
      }
      supplierDb.persistence.compactDatafile();
    }
  );
});

app.post("/productStockUpdate/:id", function (req, res, next) {
  const productId = req.params.id;
  db.findOne({ _id: productId }, function (err, product) {
    const productUnit = (
      parseInt(product.productUnit) + parseInt(req.body.productUnit)
    ).toString();
    const unit = {
      productUnit: productUnit,
    };
    db.update({ _id: productId }, { $set: unit }, function (err, newDoc) {
      if (err) {
        console.log(err);
      } else {
        res.redirect(req.get("referer"));
      }
      db.persistence.compactDatafile();
    });
  });
});

app.post("/addStore", upload.single("image"), function (req, res, next) {
  if (req.file !== undefined) {
    image = req.file;
    imageName = image.filename;
  }

  const shopDetails = {
    _id: "myShop",
    imageName: imageName,
    shopName: req.body.shopName,
    phoneNo: req.body.phoneNo,
    email: req.body.email,
    websiteUrl: req.body.websiteUrl,
    address: req.body.address,
    gstinNo: req.body.gstinNo,
    terms: req.body.terms,
  };

  const shopUpateDetails = {
    shopName: req.body.shopName,
    phoneNo: req.body.phoneNo,
    email: req.body.email,
    websiteUrl: req.body.websiteUrl,
    address: req.body.address,
    gstinNo: req.body.gstinNo,
    terms: req.body.terms,
  };

  shop.find({}, (err, shops) => {
    if (shops.length > 0) {
      shop.update(
        { _id: "myShop" },
        { $set: shopUpateDetails },
        (err, docs) => {
          if (err) {
            res.json({ msg: "error" });
          } else {
            res.json({ msg: "success" });
          }
          shop.persistence.compactDatafile();
        }
      );
    } else {
      shop.insert(shopDetails, function (err, shop) {
        if (err) {
          res.json({ msg: "error" });
        } else {
          res.json({ msg: "success" });
        }
      });
    }
  });
});

app.get("/setPrinterSize", (req, res) => {
  printerDb.find({}, function (err, docs) {
    res.render("printerSize.ejs", { printer: docs });
  });
});

app.post("/setPrinterSize", (req, res) => {
  const printerSize = { _id: "size", printerSize: req.body.printerSize };
  printerDb.find({}, (err, sizes) => {
    if (sizes.length > 0) {
      printerDb.update({ _id: "size" }, printerSize, {}, (err, size) => {
        if (err) {
          res.json({ msg: "error" });
        } else {
          res.json({ msg: "success" });
        }
      });
    } else {
      printerDb.insert(printerSize, function (err, size) {
        if (err) {
          res.json({ msg: "error" });
        } else {
          res.json({ msg: "success" });
        }
        printerDb.persistence.compactDatafile();
      });
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
  console.log("Server started on port 3000");
}
app.listen(port);
