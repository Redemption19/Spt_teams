# PowerShell script to fix chart component interfaces
$chartComponents = @(
    "ReportsOverTimeChart",
    "MonthlyApprovalTrendChart", 
    "SubmissionsByDayChart",
    "StatusBreakdownChart",
    "DepartmentReportsChart",
    "TopTemplatesChart",
    "UserSubmissionChart"
)

foreach ($component in $chartComponents) {
    $filePath = "components/reports/ReportDashboard/$component.tsx"
    if (Test-Path $filePath) {
        Write-Host "Processing $component..."
        
        # Read the file
        $content = Get-Content $filePath -Raw
        
        # Find the interface definition and add the missing properties
        $interfacePattern = "interface ${component}Props \{[^}]*\}"
        if ($content -match $interfacePattern) {
            $originalInterface = $matches[0]
            
            # Check if properties already exist
            if (-not ($originalInterface -match "showAllWorkspaces")) {
                $newInterface = $originalInterface -replace "\}", "  showAllWorkspaces?: boolean;`n  workspaceCount?: number;`n}"
                $content = $content -replace [regex]::Escape($originalInterface), $newInterface
            }
            
            # Write the updated content back
            Set-Content -Path $filePath -Value $content -NoNewline
            Write-Host "Updated $component interface"
        } else {
            Write-Host "No interface found for $component"
        }
    } else {
        Write-Host "File not found: $filePath"
    }
}

Write-Host "Chart interfaces update complete!"
