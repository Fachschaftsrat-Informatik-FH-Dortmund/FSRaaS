<?php

//load database config (MUST be outsite of the WWW folder !!!!)
$dbconfig = parse_ini_file('/CertificateAuthCA/database.ini');

//try to open the database and suppress errors
$db = @mysqli_connect($dbconfig['host'], $dbconfig['username'], $dbconfig['password'], $dbconfig['dbname'])
	or http_response_code(500);

mysqli_set_charset($db, "utf8");

if (isset($_POST["Key"]) && !empty($_POST['Key']) && isset($_POST["Value"]) && !empty($_POST['Value'])) {

	//we are *sing* paaaaraaaanoiiiiid *sing*
	$key = mysqli_real_escape_string($db, $_POST['Key']);
	$value = mysqli_real_escape_string($db, $_POST['Value']);

	$stmt = $db->prepare("INSERT INTO app_data VALUES (?, ?) ON DUPLICATE KEY UPDATE Value = ?");

	// prepare() can fail because of syntax errors, missing privileges, ....
	if ( false===$stmt ) {
		http_response_code(500);
	}

	//bind the variables to the placeholders
	$rc = $stmt->bind_param("sss", $key, $value, $value);

	// bind_param() can fail because the number of parameter doesn't match the placeholders in the statement
	// or there's a type conflict(?), or ....
	if ( false===$rc ) {
		http_response_code(500);
	}

	$rc = $stmt->execute();

	// execute() can fail for various reasons. And may it be as stupid as someone tripping over the network cable
	// 2006 "server gone away" is always an option
	if ( false===$rc ) {
		http_response_code(500);
	}

	//if reached this point we are done!
	http_response_code(200);
}
else
{
	//and I said no, no, no
	http_response_code(500);
}
//cleanup
$stmt->close();
mysqli_close($db);
?>
