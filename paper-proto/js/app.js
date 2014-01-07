/** DATABASE SETUP **/

var db = openDatabase("Test", "1.0", "Test", 65535);

// concerns database
db.transaction (function (transaction) {
  var sql = "CREATE TABLE IF NOT EXISTS concerns "
    + " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
    + "concernName VARCHAR(100) NOT NULL, "
    + "date DATETIME NOT NULL, "
    + "pendingFor VARCHAR(100) NOT NULL, "
    + "urgency VARCHAR(100) NOT NULL, "
    + "concernOrder INTEGER)"
  transaction.executeSql(
    sql, 
    undefined, 
    function () {
    }, 
    function (transaction, err) {
      console.error(err);
    }
  );
});

// doctors database
db.transaction (function (transaction) {
  var sql = "CREATE TABLE IF NOT EXISTS doctors "
    + " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," 
    + "doctorName VARCHAR(100) NOT NULL, " 
    + "specialty VARCHAR(100) NOT NULL)"
  transaction.executeSql(
    sql,
    undefined,
    function () {},
    function (transaction, err) {
      console.error(err);
    }
  );
});

// add concern
$(document).on('tap', 'add-concern-action', function() {
  var $concern = $('concern-name').val();
  if ($concern != '') {
    var urgency = ;
  }
});

function get_urgency() {
  $('#urgency-choices input:checked').attr('id').
}