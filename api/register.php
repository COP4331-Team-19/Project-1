<?php

	include('pass.php');
	$inData = getRequestInfo();
	
	$id = 0;
	$firstName = $inData["FirstName"];
	$lastName = $inData["LastName"];
	$login = $inData["Login"];
	$password = $inData["Password"];

	$conn = new mysqli("localhost", $username, $password, $database); 	
	if ($conn->connect_error) 
	{
		returnWithError( $conn->connect_error );
	} 
	else
	{
		$stmt = $conn->prepare("INSERT into Users (FirstName, LastName, Login, 'Password') VALUES(?,?,?,?)");
		$stmt->bind_param("ssss", $firstName, $lastName, $login, $password);
		try
		{
			if($stmt -> execute())
				{
					returnWithError(""); 
				}
			
		}
		catch (Exception $e)
		{
			if($e->getCode() == 1062)
				{
					returnWithError("Already Exits"); 
				}
			else
				{
					returnWithError("did not work bruh");
				}
		}
		$stmt->close();
		$conn->close();
	}

	function getRequestInfo()
	{
		return json_decode(file_get_contents('php://input'), true);
	}

	function sendResultInfoAsJson( $obj )
	{
		header('Content-type: application/json');
		echo $obj;
	}
	
	function returnWithError( $err )
	{
		$retValue = '{"error":"' . $err . '"}';
		sendResultInfoAsJson( $retValue );
	}
	
?>