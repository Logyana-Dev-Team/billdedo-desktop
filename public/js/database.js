var Datastore = require("nedb");
db = new Datastore({ filename: "db/product.db", autoload: true });
PcDb = new Datastore({ filename: "db/productCategory.db", autoload: true });

exports.addproduct = function (
  productName,
  productCatagory,
  productPrice,
  productUnit,
  productDescription
) {
  var product = {
    productName: productName,
    productCatagory: productCatagory,
    productPrice: productPrice,
    productUnit: productUnit,
    productDescription: productDescription,
  };

  db.insert(product, function (err, newDoc) {});
};

exports.getProducts = function (fnc) {
  db.find({}, function (err, docs) {
    fnc(docs);
  });
};

exports.addCategory = function (categoryName) {
  var category = {
    categoryName: categoryName,
  };

  PcDb.insert(category, function (err, newDoc) {});
};

exports.getCategory = function (fnc) {
  PcDb.find({}, function (err, docs) {
    fnc(docs);
    console.log(docs);
  });
};

// // Deletes a person
// exports.deletePerson = function (id) {
//   db.remove({ _id: id }, {}, function (err, numRemoved) {
//     // Do nothing
//   });
// };
