# Script de test des fonctions du chatbot par profil
# Usage: .\test_chatbot_profiles.ps1

$ErrorActionPreference = "Continue"

# Couleurs pour l'affichage
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

# Configuration
$baseUrl = "http://localhost:8000/api/ai/chatbot/query"

# Utilisateurs de test
$users = @{
    "AFFRETEUR" = @{
        id = "399f2fb8-06d8-4ab1-be99-a56cfb1d0907"
        role = "AFFRETEUR"
        name = "Jean Affreteur"
    }
    "TRANSPORTEUR" = @{
        id = "test-transporteur-uuid"
        role = "TRANSPORTEUR"
        name = "Pierre Transporteur"
    }
    "CLIENT" = @{
        id = "test-client-uuid"
        role = "CLIENT"
        name = "Marie Client"
    }
}

# Tests par profil
$tests = @{
    "AFFRETEUR" = @(
        @{ message = "quelles sont mes missions"; function = "get_user_missions" }
        @{ message = "calcule le prix Douala Yaounde 500kg"; function = "calculate_price" }
        @{ message = "cherche des pieces"; function = "search_products" }
        @{ message = "mon panier"; function = "get_cart" }
        @{ message = "mes commandes"; function = "get_my_orders" }
        @{ message = "mon profil"; function = "get_my_profile" }
    )
    "TRANSPORTEUR" = @(
        @{ message = "mes missions"; function = "get_user_missions" }
        @{ message = "missions disponibles"; function = "get_available_missions" }
        @{ message = "mes vehicules"; function = "get_my_vehicles" }
        @{ message = "calcule le prix Douala Yaounde"; function = "calculate_price" }
        @{ message = "mon profil"; function = "get_my_profile" }
    )
    "CLIENT" = @(
        @{ message = "cherche des freins"; function = "search_products" }
        @{ message = "mon panier"; function = "get_cart" }
        @{ message = "mes commandes"; function = "get_my_orders" }
        @{ message = "mon profil"; function = "get_my_profile" }
    )
}

Write-Info "`n========================================="
Write-Info "TEST DES FONCTIONS CHATBOT PAR PROFIL"
Write-Info "=========================================`n"

$totalTests = 0
$passedTests = 0
$failedTests = 0

foreach ($profile in $tests.Keys) {
    $user = $users[$profile]
    
    Write-Info "`n--- Profil: $profile ($($user.name)) ---`n"
    
    foreach ($test in $tests[$profile]) {
        $totalTests++
        $testName = "$profile - $($test.message)"
        
        try {
            $headers = @{
                "x-user-id" = $user.id
                "x-user-role" = $user.role
            }
            
            $body = @{
                message = $test.message
                user_id = $user.id
                user_role = $user.role
                conversationId = "test-$profile-$(Get-Random)"
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest -Uri $baseUrl -Method POST -ContentType "application/json" -Headers $headers -Body $body -ErrorAction Stop
            
            $result = $response.Content | ConvertFrom-Json
            
            # Vérifier si la réponse contient une erreur
            if ($result.requires_human -eq $true -or $result.message -match "erreur|error|désolé") {
                Write-Error "  ✗ $testName - FAILED"
                Write-Warning "    Message: $($result.message)"
                $failedTests++
            } else {
                Write-Success "  ✓ $testName - PASSED"
                $passedTests++
            }
            
            Start-Sleep -Milliseconds 500
            
        } catch {
            Write-Error "  ✗ $testName - ERROR"
            Write-Warning "    Error: $($_.Exception.Message)"
            $failedTests++
        }
    }
}

Write-Info "`n========================================="
Write-Info "RÉSULTATS"
Write-Info "=========================================`n"
Write-Info "Total tests: $totalTests"
Write-Success "Réussis: $passedTests"
Write-Error "Échoués: $failedTests"
Write-Info "Taux de réussite: $([math]::Round(($passedTests / $totalTests) * 100, 2))%"
Write-Info "`n========================================="
