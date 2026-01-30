<?php
	// Get input data
	$inData = getRequestInfo();

	// Split data up into components
	$firstName = $inData["firstName"];
	$lastName = $inData["lastName"];
	$email = $inData["email"];
	$phoneNum = $inData["phoneNum"];
	$userId = $inData["userId"];

	// Phone number unformatting for validation
	$phoneNum = preg_replace("/[^0-9]/", '', $phoneNum);

	// Phone number and email validation
	if( iconv_strlen($phoneNum) != 10 )
	{
		returnWithError("Invalid phone number format.");
	}
	if( !filter_var($email, FILTER_VALIDATE_EMAIL) ) 
	{
		returnWithError("Invalid Email format.");
	}

	// Phone number reformatting for readability
	$phoneNum = str_split($phoneNum, 3);
	$phoneNum = "$phoneNum[0]-$phoneNum[1]-$phoneNum[2]$phoneNum[3]";
	
	// Connect to mySQL
	$conn = new mysqli("localhost", $username, $password, $database);
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
	else
	{
		// Send insert query with sanitized, validated, and formatted inputs
		$stmt = $conn->prepare("INSERT IGNORE into Contacts (FirstName,LastName,Phone,Email,UserID) VALUES(?,?,?,?,?)");
		$stmt->bind_param("sssss", $firstName, $lastName, $phoneNum, $email, $userId);
		$stmt->execute();

		// Detect number of inserted rows
		$insertedRows = $stmt->affected_rows;

		// Close connection
		$stmt->close();
		$conn->close();

		// If no inserted rows, must be a duplicate due to database UNIQUE option
		if( $insertedRows == 0){
			returnWithError("Contact already exists.");
		}
		else
		{
			returnWithError("");
		}
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