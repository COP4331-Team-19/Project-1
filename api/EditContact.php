<?php
	// Include mysqli passwords file
	include('pass.php');
	
	// Get input data
	$inData = getRequestInfo();

	// Split data up into components
	$userId = $inData["userId"];
	$oldValues = $inData["oldValues"];
	$newValues = $inData["newValues"];

	// Split up objects delivered as newValues and newValues
	$oldFirst = $oldValues["firstName"];
	$oldLast = $oldValues["lastName"];
	$oldEmail = $oldValues["email"];
	$oldPhone = $oldValues["phoneNum"];
	$newFirst = $newValues["firstName"];
	$newLast = $newValues["lastName"];
	$newEmail = $newValues["email"];
	$newPhone = $newValues["phoneNum"];
	
	// Phone number unformatting for validation
	$newPhone = preg_replace("/[^0-9]/", '', $newPhone);

	// Phone number and email validation
	if( iconv_strlen($newPhone) != 10 )
	{
		returnWithError("Invalid phone number format.");
	}
	if( !filter_var($newEmail, FILTER_VALIDATE_EMAIL) ) 
	{
		returnWithError("Invalid Email format.");
	}

	// Phone number reformatting for readability
	$newPhone = str_split($newPhone, 3);
	$newPhone = "$newPhone[0]-$newPhone[1]-$newPhone[2]$newPhone[3]";

	// Connect to mySQL
	$conn = new mysqli("localhost", $username, $password, $database);
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
	else
	{
		// If contact exists, PHP throws a fatal exception, try-catch to allow for error return instead of HTTP 500
		try
		{
			// Send insert query with validated, and formatted inputs
			$stmt = $conn->prepare("UPDATE Contacts SET FirstName=?,LastName=?, Email=?, Phone=? WHERE FirstName=? AND LastName=? AND Email=? AND Phone=? AND UserID=?");
			$stmt->bind_param("sssssssss", $newFirst, $newLast, $newEmail, $newPhone, $oldFirst, $oldLast, $oldEmail, $oldPhone, $userId);
			$stmt->execute();
		}
		catch (mysqli_sql_exception $e)
		{
			returnWithError("Contact already exists.");
		}

		// Close connection
		$stmt->close();
		$conn->close();
	}

	// Decode JSON for splitting
	function getRequestInfo()
	{
		return json_decode(file_get_contents('php://input'), true);
	}
	// Send JSON back
	function sendResultInfoAsJson( $obj )
	{
		header('Content-type: application/json');
		echo $obj;
	}
	// Return JSON with parameter error
	function returnWithError( $err )
	{
		$retValue =
		[
			"error" => $err
		];
		sendResultInfoAsJson( json_encode($retValue) );
		exit();
	}
?>