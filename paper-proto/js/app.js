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
  $i = 0;
  if ($concern != '') {
    db.transaction(function (transaction) {
      var sql = "INSERT INTO concerns (concernName, date, pendingFor, urgency, concernOrder) VALUES (?, ?, ?, ?, ?)";
      transaction.executeSql(
        sql,
        [$concern, new Date(), $('#pending-for').val(), get_urgency(), 0],
        function (transaction, result) {
          $i = result.insertId;
          db.transaction(function (transaction) {
              var sql = "UPDATE concerns SET concernOrder=" + $("#concernList").children().size() + " WHERE id=" + $i;
              transaction.executeSql(
                sql, 
                undefined, 
                function () {}, 
                function (transaction, error) {
                  console.error("error: " + error.message);
                }
              );
            });
        }
      );
    })
  }
});

function get_urgency() {
  return $('#urgency-choices input:checked').attr('id')
}