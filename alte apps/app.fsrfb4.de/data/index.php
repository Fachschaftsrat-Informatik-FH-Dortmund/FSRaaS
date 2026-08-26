<?php
$dbconfig = parse_ini_file('/CertificateAuthCA/database.ini');

header('Content-Type: application/json; charset=utf-8');

$rows = array();

$db=@mysqli_connect($dbconfig['host'], $dbconfig['username'], $dbconfig['password'], $dbconfig['dbname'])
	or die(json_encode($rows));

mysqli_set_charset($db, "utf8");

if (isset($_POST["Key"]))
{
	$key = mysqli_real_escape_string($db, $_POST['Key']);

	$stmt = $db->prepare("SELECT * FROM app_data WHERE datakey = ?");
	
	if ( false===$stmt ) {
		die(json_encode($rows));
	}

	$rc = $stmt->bind_param("s", $key);

	if ( false===$rc ) {
		die(json_encode($rows));
	}
}
else
{
	$stmt = $db->prepare("SELECT * FROM app_data");
	if ( false===$stmt ) {
		die(json_encode($rows));
	}
}


$rc = $stmt->execute();

if ( false===$rc ) {
	die(json_encode($rows));
}

$result = $stmt->get_result();

while ($row = $result->fetch_assoc())
{
		$rows[] = array_map(null, $row);
}
if (isset($_POST["Key"]))
{
	echo json_encode($rows[0]);
}
else
{
	echo json_encode($rows);
}

$stmt->close();
mysqli_close($db);
?>
