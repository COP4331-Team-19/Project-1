<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

	include('pass.php');
	$inData = getRequestInfo();
	
	$id = 0;
	$firstName = $inData["FirstName"] ?? "";
	$lastName  = $inData["LastName"]  ?? "";
	$login     = $inData["Login"]     ?? "";
	$userPass  = $inData["Password"]  ?? "";
	$conn = new mysqli("localhost", $username, $password, $database); 	

	if ($firstName === "" || $lastName === "" || $login === "" || $userPass === "") {
    returnWithError("Missing required fields", 400);
}

	if ($conn->connect_error) 
	{
		returnWithError( $conn->connect_error, 500 );
	} 
	else
	{
		$stmt = $conn->prepare("INSERT into Users (FirstName, LastName, Login, Password) VALUES(?,?,?,?)");
		$stmt->bind_param("ssss", $firstName, $lastName, $login, $userPass);
		try
		{
			 $check = $conn->prepare("SELECT ID FROM Users WHERE Login=? LIMIT 1");
    $check->bind_param("s", $login);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0)
    {
        $check->close();
        $conn->close();
        returnWithError("Login already exists", 409);
    }
    $check->close();

    // 2) Insert new user
    $stmt = $conn->prepare("INSERT INTO Users (FirstName, LastName, Login, Password) VALUES (?,?,?,?)");
    $stmt->bind_param("ssss", $firstName, $lastName, $login, $userPass);
    $stmt->execute();

    $stmt->close();
    $conn->close();

    // Success response
    returnWithError("", 200);
		}

		catch (Exception $e)
		{
			if($e->getCode() == 1062)
				{
					returnWithError("Already Exists", 409); 
				}
			else
				{
					returnWithError("Database Error", 500);
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
	
	function returnWithError( $err, $http_code = 200)
	{
		http_response_code($http_code);
		$retValue = '{"error":"' . $err . '"}';
		sendResultInfoAsJson( $retValue );
		exit();
	}
	
?>