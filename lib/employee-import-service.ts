export interface ImportedEmployee {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  role: string;
  department: string;
  manager: string;
  hireDate: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  workLocation: 'office' | 'remote' | 'hybrid';
  probationEndDate: string;
  contractEndDate: string;
  baseSalary: string;
  currency: string;
  payFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  housingAllowance: string;
  transportAllowance: string;
  medicalAllowance: string;
  otherAllowance: string;
  benefits: string;
  errors?: string[];
  isValid?: boolean;
}

export interface ImportResult {
  employees: ImportedEmployee[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
}

export class EmployeeImportService {
  // Expected column headers for import
  static readonly EXPECTED_HEADERS = [
    'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
    'street', 'city', 'state', 'zipCode', 'country',
    'emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone',
    'role', 'department', 'manager', 'hireDate', 'employmentType', 'workLocation',
    'probationEndDate', 'contractEndDate', 'baseSalary', 'currency', 'payFrequency',
    'housingAllowance', 'transportAllowance', 'medicalAllowance', 'otherAllowance', 'benefits'
  ];

  // Generate sample CSV template
  static generateCSVTemplate(): string {
    const headers = this.EXPECTED_HEADERS.join(',');
    const sampleRow = [
      'John', 'Doe', 'john.doe@company.com', '+1234567890', '1990-01-01', 'male',
      '123 Main St', 'New York', 'NY', '10001', 'United States',
      'Jane Doe', 'Spouse', '+1234567891',
      'Software Engineer', 'Development', 'Manager Name', '2024-01-15', 'full-time', 'office',
      '', '', '50000', 'USD', 'monthly',
      '0', '0', '0', '0', 'Health Insurance, Dental Coverage'
    ].join(',');
    
    return `${headers}\n${sampleRow}`;
  }

  // Parse CSV file
  static async parseCSV(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV file must have at least a header row and one data row'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const dataRows = lines.slice(1);
          
          const employees: ImportedEmployee[] = [];
          const errors: string[] = [];
          let validRows = 0;
          let invalidRows = 0;

          dataRows.forEach((row, index) => {
            const values = row.split(',').map(v => v.trim());
            const employee = this.parseRow(headers, values, index + 2); // +2 for header row and 1-based index
            
            if (employee.isValid) {
              validRows++;
            } else {
              invalidRows++;
            }
            
            employees.push(employee);
          });

          resolve({
            employees,
            totalRows: dataRows.length,
            validRows,
            invalidRows,
            errors
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Parse Excel file (basic implementation - you might want to use a library like xlsx)
  static async parseExcel(file: File): Promise<ImportResult> {
    // For now, we'll convert Excel to CSV and parse it
    // In a real implementation, you'd use a library like 'xlsx'
    throw new Error('Excel parsing not implemented yet. Please use CSV format.');
  }

  // Parse a single row of data
  private static parseRow(headers: string[], values: string[], rowNumber: number): ImportedEmployee {
    const employee: ImportedEmployee = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      role: '',
      department: '',
      manager: '',
      hireDate: '',
      employmentType: 'full-time',
      workLocation: 'office',
      probationEndDate: '',
      contractEndDate: '',
      baseSalary: '',
      currency: 'USD',
      payFrequency: 'monthly',
      housingAllowance: '0',
      transportAllowance: '0',
      medicalAllowance: '0',
      otherAllowance: '0',
      benefits: '',
      errors: [],
      isValid: true
    };

    const rowErrors: string[] = [];

    // Map values to employee object
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      switch (header) {
        case 'firstname':
          employee.firstName = value;
          break;
        case 'lastname':
          employee.lastName = value;
          break;
        case 'email':
          employee.email = value;
          break;
        case 'phone':
          employee.phone = value;
          break;
        case 'dateofbirth':
          employee.dateOfBirth = value;
          break;
        case 'gender':
          employee.gender = this.validateGender(value);
          break;
        case 'street':
          employee.street = value;
          break;
        case 'city':
          employee.city = value;
          break;
        case 'state':
          employee.state = value;
          break;
        case 'zipcode':
          employee.zipCode = value;
          break;
        case 'country':
          employee.country = value;
          break;
        case 'emergencycontactname':
          employee.emergencyContactName = value;
          break;
        case 'emergencycontactrelationship':
          employee.emergencyContactRelationship = value;
          break;
        case 'emergencycontactphone':
          employee.emergencyContactPhone = value;
          break;
        case 'role':
          employee.role = value;
          break;
        case 'department':
          employee.department = value;
          break;
        case 'manager':
          employee.manager = value;
          break;
        case 'hiredate':
          employee.hireDate = value;
          break;
        case 'employmenttype':
          employee.employmentType = this.validateEmploymentType(value);
          break;
        case 'worklocation':
          employee.workLocation = this.validateWorkLocation(value);
          break;
        case 'probationenddate':
          employee.probationEndDate = value;
          break;
        case 'contractenddate':
          employee.contractEndDate = value;
          break;
        case 'basesalary':
          employee.baseSalary = value;
          break;
        case 'currency':
          employee.currency = value || 'USD';
          break;
        case 'payfrequency':
          employee.payFrequency = this.validatePayFrequency(value);
          break;
        case 'housingallowance':
          employee.housingAllowance = value || '0';
          break;
        case 'transportallowance':
          employee.transportAllowance = value || '0';
          break;
        case 'medicalallowance':
          employee.medicalAllowance = value || '0';
          break;
        case 'otherallowance':
          employee.otherAllowance = value || '0';
          break;
        case 'benefits':
          employee.benefits = value;
          break;
      }
    });

    // Validate required fields
    if (!employee.firstName) rowErrors.push('First name is required');
    if (!employee.lastName) rowErrors.push('Last name is required');
    if (!employee.email) rowErrors.push('Email is required');
    if (!employee.phone) rowErrors.push('Phone is required');
    if (!employee.role) rowErrors.push('Role is required');
    if (!employee.department) rowErrors.push('Department is required');
    if (!employee.hireDate) rowErrors.push('Hire date is required');
    if (!employee.baseSalary) rowErrors.push('Base salary is required');

    // Validate email format
    if (employee.email && !this.isValidEmail(employee.email)) {
      rowErrors.push('Invalid email format');
    }

    // Validate date formats
    if (employee.dateOfBirth && !this.isValidDate(employee.dateOfBirth)) {
      rowErrors.push('Invalid date of birth format (use YYYY-MM-DD)');
    }
    if (employee.hireDate && !this.isValidDate(employee.hireDate)) {
      rowErrors.push('Invalid hire date format (use YYYY-MM-DD)');
    }

    // Validate numeric fields
    if (employee.baseSalary && isNaN(Number(employee.baseSalary))) {
      rowErrors.push('Base salary must be a number');
    }

    employee.errors = rowErrors;
    employee.isValid = rowErrors.length === 0;

    return employee;
  }

  // Validation helpers
  private static validateGender(value: string): 'male' | 'female' | 'other' {
    const gender = value.toLowerCase();
    if (['male', 'female', 'other'].includes(gender)) {
      return gender as 'male' | 'female' | 'other';
    }
    return 'male'; // default
  }

  private static validateEmploymentType(value: string): 'full-time' | 'part-time' | 'contract' | 'intern' {
    const type = value.toLowerCase();
    if (['full-time', 'part-time', 'contract', 'intern'].includes(type)) {
      return type as 'full-time' | 'part-time' | 'contract' | 'intern';
    }
    return 'full-time'; // default
  }

  private static validateWorkLocation(value: string): 'office' | 'remote' | 'hybrid' {
    const location = value.toLowerCase();
    if (['office', 'remote', 'hybrid'].includes(location)) {
      return location as 'office' | 'remote' | 'hybrid';
    }
    return 'office'; // default
  }

  private static validatePayFrequency(value: string): 'monthly' | 'bi-weekly' | 'weekly' {
    const frequency = value.toLowerCase();
    if (['monthly', 'bi-weekly', 'weekly'].includes(frequency)) {
      return frequency as 'monthly' | 'bi-weekly' | 'weekly';
    }
    return 'monthly'; // default
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
} 