<?php
	// Include mysqli passwords file
	include('pass.php');

	// Get input data
	$inData = getRequestInfo();

	// Split data up into components
	$searchResults = "";
	$searchCount = 0;
	
	// Connect to mySQL
	$conn = new mysqli("localhost", $username, $password, $database);
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
	else
	{
		// Format search term to fit SQL LIKE formatting (contains)
		$searchTerm = "%" . $inData["search"] . "%";
		// Unformat search term as phone number 
		$searchPhone = preg_replace("/[^0-9]/", '', $inData["search"]);
		$searchFlag = 0;

		// Determine if search term is phone number or email
		if( filter_var($inData["search"], FILTER_VALIDATE_EMAIL) ) 
		{
			$searchFlag = 1; // Flagged as full email
		}
		else if( iconv_strlen($searchPhone) == 10 )
		{
			$searchFlag = 2; // Flagged as phone number
			// Reformat phone number to match format in database
			$searchPhone = str_split($searchPhone, 3);
			$searchPhone = "%$searchPhone[0]-$searchPhone[1]-$searchPhone[2]$searchPhone[3]%";
		}
		
		if( $searchFlag == 0 )
		{
			// Possibly full name is searched, so split
			$name = explode(" ", $searchTerm, 2);
			// If there is more than one word (aka a full name)
			if( count($name) > 1 )
			{
				// Split into two variables
				$firstName = $name[0];
				$lastName = $name[1];
				// Format search term to fit SQL LIKE formatting (contains)
				$searchTerm = "%" . $inData["search"] . "%";
				$firstName = "%$firstName%";
				$lastName = "%$lastName%";

				// Prepare insert query, email here to ensure partial emails are still searched, first AND last name must match
				$stmt = $conn->prepare("select FirstName as firstName,LastName as lastName,Phone as phoneNum,Email as email from Contacts where UserID=? and ((FirstName like ? and LastName like ?) or Email like ?)");
			}
			else
			{
				// If not, make both variables same so lookup works properly
				$firstName = $name[0];
				$lastName = $name[0];
				// Format search term to fit SQL LIKE formatting (contains)
				$searchTerm = "%" . $inData["search"] . "%";
				$firstName = "%$firstName%";
				$lastName = "%$lastName%";

				// Prepare insert query, email and phoneNum here to ensure partial emails and phone numbers are still searched
				$stmt = $conn->prepare("select FirstName as firstName,LastName as lastName,Phone as phoneNum,Email as email from Contacts where UserID=? and (FirstName like ? or LastName like ? or Email like ? or Phone like ?)");
			}
			
			// Bind to query
			$stmt->bind_param("sssss", $inData["userId"], $firstName, $lastName, $searchTerm, $searchTerm);
		}
		else if( $searchFlag == 1 )
		{
			// Prepare insert query
			$stmt = $conn->prepare("select FirstName as firstName,LastName as lastName,Phone as phoneNum,Email as email from Contacts where UserID=? and Email like ?");
			// Format search term to fit SQL LIKE formatting (contains) and bind to query
			$searchTerm = "%" . $inData["search"] . "%";
			$stmt->bind_param("ss", $inData["userId"], $searchTerm);
		}
		else
		{
			// Prepare insert query
			$stmt = $conn->prepare("select FirstName as firstName,LastName as lastName,Phone as phoneNum,Email as email from Contacts where UserID=? and Phone like ?");
			// Format search term to fit SQL LIKE formatting (contains) and bind to query
			$searchTerm = "%" . $searchPhone . "%";
			$stmt->bind_param("ss", $inData["userId"], $searchTerm);
		}
		
		// Execute SQL command
		$stmt->execute();
		
		// Receive set of responses
		$result = $stmt->get_result();
		
		// Returns all rows in JSON array of objects format
		$rows = $result->fetch_all(MYSQLI_ASSOC);
		$searchCount = count($rows);
		$searchResults = json_encode($rows);
		
		// If nothing returned, error. Otherwise return info
		if( $searchCount == 0 )
		{
			returnWithError( "No Records Found" );
		}
		else
		{
			returnWithInfo( $rows );
		}
		
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
	// Return JSON with results
	function returnWithInfo( $searchResults )
	{
		$retValue = 
		[
			"results" => $searchResults,
			"error" => ""
		];
		sendResultInfoAsJson( json_encode($retValue) );
	}
?>