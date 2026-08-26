<?php
//READ:
//https://www.binpress.com/tutorial/using-php-with-mysql-the-right-way/17

//load database config (MUST be outsite of the WWW folder !!!!)
$dbconfig = parse_ini_file('/CertificateAuthCA/database.ini');

//return json only
header('Content-Type: application/json; charset=utf-8');

//we will return a empty array if there is an error at least
$rows = array();

//try to open the database and suppress errors
$db=@mysqli_connect($dbconfig['host'], $dbconfig['username'], $dbconfig['password'], $dbconfig['dbname'])
	//error: return empty JSON array
	or die(json_encode($rows));

//set encoding to UTF8:
//we should avoid this!!!!
//LINK
//https://stackoverflow.com/questions/766809/whats-the-difference-between-utf8-general-ci-and-utf8-unicode-ci
//https://stackoverflow.com/questions/1036454/what-are-the-diffrences-between-utf8-general-ci-and-utf8-unicode-ci
//mysqli_set_charset($db, "utf8_general_ci");

//BETTER
mysqli_set_charset($db, "utf8");
//OR
//mysqli_set_charset($db, "utf8");

//check all variables
if (isset($_POST["Sprache"]) && $_POST['API'] && $_POST['VersionCode'])
{
	//escape all variables!!!
	//since we use prepared statements from now on there is no _absolute_ reason to escape the variables anymore
	//we do it anyway to be sure by have it done twice
	$api = mysqli_real_escape_string($db, $_POST['API']);
	$versioncode = mysqli_real_escape_string($db, $_POST['VersionCode']);
	$sprache = mysqli_real_escape_string($db, $_POST['Sprache']);

	if(strcmp($sprache, "de")==0)
	{
		//prepare DE statement (have you seen the placeholders? Look for the "?".)
		$stmt = $db->prepare("SELECT ID, Titel_de as Titel, Text_de as Text, Button1Text_de as Button1Text, Button2Text_de as Button2Text, Button1Action, Button2Action, Dauerhaft FROM app_messages WHERE Aktiv = TRUE AND ((Min_API<=? AND Max_API >= ?) OR (Min_API=0 AND Max_API=0)) AND ((Min_VersionCode<=? AND Max_VersionCode >= ?) OR (Min_VersionCode=0 AND Max_VersionCode=0))");
	}
	else
	{
		//prepare EN statement (have you seen the placeholders? Look for the "?".)
		$stmt = $db->prepare("SELECT ID, Titel_en as Titel, Text_en as Text, Button1Text_en as Button1Text, Button2Text_en as Button2Text, Button1Action, Button2Action, Dauerhaft FROM app_messages WHERE Aktiv = TRUE AND ((Min_API<=? AND Max_API >= ?) OR (Min_API=0 AND Max_API=0)) AND ((Min_VersionCode<=? AND Max_VersionCode >= ?) OR (Min_VersionCode=0 AND Max_VersionCode=0))");
	}

	// prepare() can fail because of syntax errors, missing privileges, ....
	if ( false===$stmt ) {
		//error: return empty JSON array
		die(json_encode($rows));
	}

	//bind the variables to the placeholders
	// "s" => string
	// "i" => number
	$rc = $stmt->bind_param("ssss", $api, $api, $versioncode, $versioncode);

	//MAY be BETTER (if $api, $versioncode are numeric)
	//$rc = $stmt->bind_param("ii", $api, $versioncode);

	// bind_param() can fail because the number of parameter doesn't match the placeholders in the statement
	// or there's a type conflict(?), or ....
	if ( false===$rc ) {
		//error: return empty JSON array
		die(json_encode($rows));
	}
}
else
{
	//prepare simple statement
	$stmt = $db->prepare("SELECT * FROM app_messages WHERE Aktiv = TRUE");
	if ( false===$stmt ) {
		//error: return empty JSON array
		die(json_encode($rows));
	}
}


$rc = $stmt->execute();

// execute() can fail for various reasons. And may it be as stupid as someone tripping over the network cable
// 2006 "server gone away" is always an option
if ( false===$rc ) {
	//error: return empty JSON array
	die(json_encode($rows));
}

$result = $stmt->get_result();

//prepare the result array
while ($row = $result->fetch_assoc())
{
		$rows[] = array_map(null, $row);
}

//make it JSON
echo json_encode($rows);

//cleanup
$stmt->close();
mysqli_close($db);
?>
