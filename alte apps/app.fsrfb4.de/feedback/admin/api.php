<?php
$dbconfig = parse_ini_file('/CertificateAuthCA/database.ini');

header('Content-Type: application/json; charset=utf-8');

$rows = array();

$db=@mysqli_connect($dbconfig['host'], $dbconfig['username'], $dbconfig['password'], $dbconfig['dbname'])
	or die(json_encode($rows));

mysqli_set_charset($db, "utf8");

$stmt = $db->prepare("SELECT * FROM app_feedback");
if ( false===$stmt ) {
	die(json_encode($rows));
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

echo json_encode($rows);


$stmt->close();
mysqli_close($db);
?>
