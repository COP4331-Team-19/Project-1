<?php
// Include mysqli passwords file
	include('pass.php');
	
	// Get input data
	$inData = getRequestInfo();

    $userId = $inData["ID"];

    $conn = new mysqli("localhost", $username, $password, $database); 	
	//new mysqli(host, username, password, database);
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error, 404 );
	}
    else
        {
            $stmt = $conn->prepare("SELECT FirstName, LastName, Phone, Email FROM Contacts Where UserID=? ");
            $stmt->bind_param("s", $userId );
            $stmt->execute();

	        $result = $stmt->get_result();

             while ($row = $result->fetch_assoc()) 
            {
                $contacts[] = $row;
            }

    $stmt->close();
    $conn->close();

    // Return contacts as JSON
    echo json_encode($contacts);
}
function getRequestInfo()
{
	return json_decode(file_get_contents('php://input'), true);
}

function sendResultInfoAsJson($obj)
{
	header('Content-type: application/json');
	echo $obj;
}

function returnWithError($err, $http_code = 200)
{
	http_response_code($http_code);
	$retValue = '{"error":"' . $err . '"}';
	sendResultInfoAsJson($retValue);
	exit();
}
?>