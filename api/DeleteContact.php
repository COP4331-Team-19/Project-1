<?php
	// Include mysqli passwords file
	include('pass.php');
	
	// Get input data
	$inData = getRequestInfo();

	// Split data up into components
	$firstName = $inData["firstName"];
	$lastName = $inData["lastName"];
	$email = $inData["email"];
	$phoneNum = $inData["phoneNum"];
	$userId = $inData["userId"];

	// Connect to mySQL
	$conn = new mysqli("localhost", $username, $password, $database);
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
	else
	{
		// Send delete query
		$stmt = $conn->prepare("DELETE FROM Contacts WHERE FirstName=? AND LastName=? AND Email=? AND Phone=? AND UserID=?");
		$stmt->bind_param("sssss", $firstName, $lastName, $email, $phoneNum, $userId);
		$stmt->execute();

		// Detect number of inserted rows
		$deletedRows = $stmt->affected_rows;

		// Close connection
		$stmt->close();
		$conn->close();

		// If no inserted rows, must be a duplicate due to database UNIQUE option
		if( $deletedRows == 0){
			returnWithError("Contact not deleted. May not exist?");
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