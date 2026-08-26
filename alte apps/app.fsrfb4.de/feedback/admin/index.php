<?php
//load database config (MUST be outsite of the WWW folder !!!!)
$dbconfig = parse_ini_file('/CertificateAuthCA/database.ini');

//try to open the database and suppress errors
$db=mysqli_connect($dbconfig['host'], $dbconfig['username'], $dbconfig['password'], $dbconfig['dbname'])
	or die(mysqli_connect_error());

mysqli_set_charset($db, "utf8");

//prepare simple statement
$stmt = $db->prepare("SELECT Nr, Name, Feedback, Zeit, Api, VersionCode FROM app_feedback ORDER BY Nr DESC");
if ( false===$stmt ) {
	die("error while prepare statement");
}

$rc = $stmt->execute();

// execute() can fail for various reasons. And may it be as stupid as someone tripping over the network cable
// 2006 "server gone away" is always an option
if ( false===$rc ) {
	die(mysqli_stmt_error($stmt));
}

$result = $stmt->get_result();

?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Feedback</title>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css" integrity="sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp" crossorigin="anonymous">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
<style type="text/css">
    .bs-example{
    	margin: 20px;
    }
</style>
</head>
<body>
<div class="bs-example">
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Nr</th>
                <th>Name</th>
                <th>Feedback</th>
		        <th>Zeit</th>
		        <th>Api</th>
		        <th>VersionCode</th>
            </tr>
        </thead>
        <tbody>

<?php
//prepare the result array
while ($row = $result->fetch_assoc())
{
	echo "\t<tr>\n"; // Zeile erzeugen
	// foreach Anfang:
	foreach ($row as $key => $value) {
			//elvis operator
			echo "\t\t<td>" . (!empty($value) ? $value : "&nbsp;") . "</td>\n";
	} // foreach Ende
	echo "\t</tr>\n"; // Zeile schließen
}

//cleanup
$stmt->close();
mysqli_close($db);
?>
        </tbody>
    </table>
</div>
</body>
</html>
