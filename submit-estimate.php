<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Get form data
    $customerName = $_POST['customerName'] ?? '';
    $customerEmail = $_POST['customerEmail'] ?? '';
    $customerPhone = $_POST['customerPhone'] ?? '';
    $customerAddress = $_POST['customerAddress'] ?? '';
    $projectType = $_POST['projectType'] ?? '';
    $materialType = $_POST['materialType'] ?? '';
    $projectNotes = $_POST['projectNotes'] ?? '';
    $totalArea = $_POST['totalArea'] ?? '';
    $totalCost = $_POST['totalCost'] ?? '';
    $materialCost = $_POST['materialCost'] ?? '';
    $laborCost = $_POST['laborCost'] ?? '';
    $equipmentCost = $_POST['equipmentCost'] ?? '';
    $materialCostPerSqFt = $_POST['materialCostPerSqFt'] ?? '';
    $shapesCount = $_POST['shapesCount'] ?? '';
    $coordinates = $_POST['coordinates'] ?? '';

    // Validate required fields
    if (empty($customerName) || empty($customerEmail) || empty($customerPhone) || empty($customerAddress)) {
        throw new Exception('Missing required customer information');
    }

    // Handle map screenshot upload
    $screenshotPath = null;
    if (isset($_FILES['mapScreenshot']) && $_FILES['mapScreenshot']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $fileName = 'property_map_' . date('Y-m-d_H-i-s') . '_' . uniqid() . '.png';
        $screenshotPath = $uploadDir . $fileName;
        
        if (!move_uploaded_file($_FILES['mapScreenshot']['tmp_name'], $screenshotPath)) {
            throw new Exception('Failed to save screenshot');
        }
    }

    // Create email content
    $subject = "New Paving Estimate Request - " . $customerName;
    
    $emailBody = "NEW PAVING ESTIMATE REQUEST\n";
    $emailBody .= str_repeat("=", 50) . "\n\n";
    
    $emailBody .= "CUSTOMER INFORMATION:\n";
    $emailBody .= "Name: " . $customerName . "\n";
    $emailBody .= "Email: " . $customerEmail . "\n";
    $emailBody .= "Phone: " . $customerPhone . "\n";
    $emailBody .= "Address: " . $customerAddress . "\n\n";
    
    $emailBody .= "PROJECT DETAILS:\n";
    $emailBody .= "Type: " . ucfirst($projectType) . "\n";
    $emailBody .= "Material: " . ucfirst($materialType) . " ($" . $materialCostPerSqFt . "/sq ft)\n";
    $emailBody .= "Total Area: " . number_format($totalArea) . " sq ft (" . $shapesCount . " shapes)\n\n";
    
    $emailBody .= "COST BREAKDOWN:\n";
    $emailBody .= "Material Cost: $" . number_format($materialCost, 2) . "\n";
    $emailBody .= "Labor Cost: $" . number_format($laborCost, 2) . " ($3/sq ft)\n";
    $emailBody .= "Equipment Cost: $" . number_format($equipmentCost, 2) . "\n";
    $emailBody .= "TOTAL ESTIMATE: $" . number_format($totalCost, 2) . "\n\n";
    
    if (!empty($coordinates)) {
        $emailBody .= "MAP COORDINATES:\n";
        $emailBody .= $coordinates . "\n\n";
    }
    
    if (!empty($projectNotes)) {
        $emailBody .= "ADDITIONAL NOTES:\n";
        $emailBody .= $projectNotes . "\n\n";
    }
    
    $emailBody .= "SUBMISSION DETAILS:\n";
    $emailBody .= "Submitted: " . date('Y-m-d H:i:s T') . "\n";
    $emailBody .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
    $emailBody .= "User Agent: " . $_SERVER['HTTP_USER_AGENT'] . "\n\n";
    
    $emailBody .= "Please contact the customer within 24 hours to provide a detailed quote.\n";
    $emailBody .= "For questions, call (740) 453-3063 or email sales@neffpaving.com";

    // Email settings
    $to = "estimates@neffpaving.com";
    $headers = "From: noreply@neffpaving.com\r\n";
    $headers .= "Reply-To: " . $customerEmail . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    
    // Check if we have a screenshot to attach
    if ($screenshotPath && file_exists($screenshotPath)) {
        // Create multipart email with attachment
        $boundary = md5(time());
        
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/mixed; boundary=\"" . $boundary . "\"\r\n";
        
        $message = "--" . $boundary . "\r\n";
        $message .= "Content-Type: text/plain; charset=\"UTF-8\"\r\n";
        $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
        $message .= $emailBody . "\r\n\r\n";
        
        // Add screenshot attachment
        $fileContent = file_get_contents($screenshotPath);
        $fileContentEncoded = chunk_split(base64_encode($fileContent));
        
        $message .= "--" . $boundary . "\r\n";
        $message .= "Content-Type: image/png; name=\"property_map.png\"\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n";
        $message .= "Content-Disposition: attachment; filename=\"property_map.png\"\r\n\r\n";
        $message .= $fileContentEncoded . "\r\n";
        $message .= "--" . $boundary . "--\r\n";
        
        // Clean up uploaded file
        unlink($screenshotPath);
    } else {
        // Simple text email without attachment
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $message = $emailBody;
    }

    // Send email
    if (mail($to, $subject, $message, $headers)) {
        // Also send confirmation email to customer
        $customerSubject = "Paving Estimate Request Confirmation - Neff Paving";
        $customerMessage = "Dear " . $customerName . ",\n\n";
        $customerMessage .= "Thank you for requesting a paving estimate from Neff Paving!\n\n";
        $customerMessage .= "We have received your request for:\n";
        $customerMessage .= "• Project Type: " . ucfirst($projectType) . "\n";
        $customerMessage .= "• Material: " . ucfirst($materialType) . "\n";
        $customerMessage .= "• Total Area: " . number_format($totalArea) . " sq ft\n";
        $customerMessage .= "• Estimated Cost: $" . number_format($totalCost, 2) . "\n\n";
        $customerMessage .= "Our team will review your request and contact you within 24 hours to schedule a site visit and provide a detailed quote.\n\n";
        $customerMessage .= "For immediate assistance, please call us at (740) 453-3063.\n\n";
        $customerMessage .= "Thank you for choosing Neff Paving!\n\n";
        $customerMessage .= "Best regards,\n";
        $customerMessage .= "The Neff Paving Team\n";
        $customerMessage .= "6575 West Pike, Zanesville, OH 43701\n";
        $customerMessage .= "Phone: (740) 453-3063\n";
        $customerMessage .= "Email: sales@neffpaving.com";

        $customerHeaders = "From: sales@neffpaving.com\r\n";
        $customerHeaders .= "Reply-To: sales@neffpaving.com\r\n";
        $customerHeaders .= "Content-Type: text/plain; charset=UTF-8\r\n";
        
        mail($customerEmail, $customerSubject, $customerMessage, $customerHeaders);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Estimate request submitted successfully! You will receive a confirmation email shortly.'
        ]);
    } else {
        throw new Exception('Failed to send email');
    }

} catch (Exception $e) {
    error_log("Estimate submission error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Failed to submit estimate request. Please try again or call (740) 453-3063.'
    ]);
}
?>
