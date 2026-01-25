import { describe, expect, test, mock } from 'bun:test';
import { SemanticFormData, type FormDataLLMClientInterface } from '../form-data.ts';
import type { Message } from '../../../llm/types.ts';

/**
 * Create a mock LLM client that returns predetermined responses
 */
function createMockLLMClient(
  responses: Record<string, string>
): FormDataLLMClientInterface {
  return {
    chat: mock(
      ({
        messages,
        systemPrompt,
      }: {
        messages: Message[];
        systemPrompt?: string;
      }) => {
        // Find matching response based on system prompt or message content
        for (const [key, value] of Object.entries(responses)) {
          if (
            systemPrompt?.includes(key) ||
            messages.some((m) => m.content.includes(key))
          ) {
            return Promise.resolve({ content: value });
          }
        }
        // Default response
        return Promise.resolve({ content: '{"error": "No mock response found"}' });
      }
    ),
  };
}

describe('SemanticFormData', () => {
  describe('constructor', () => {
    test('creates instance with FormData value', () => {
      const formData = new FormData();
      formData.append('name', 'John');
      const semanticForm = new SemanticFormData(formData);
      expect(semanticForm.get('name')).toBe('John');
    });

    test('creates instance with context', () => {
      const formData = new FormData();
      const semanticForm = new SemanticFormData(formData, 'user registration');
      expect(semanticForm.getContext()).toBe('user registration');
    });

    test('creates instance with custom LLM client', () => {
      const mockClient = createMockLLMClient({});
      const formData = new FormData();
      const semanticForm = new SemanticFormData(formData, undefined, mockClient);
      expect(semanticForm.valueOf()).toBeInstanceOf(FormData);
    });
  });

  describe('static from()', () => {
    test('creates SemanticFormData from existing FormData', () => {
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      const semanticForm = SemanticFormData.from(formData);
      expect(semanticForm.get('email')).toBe('test@example.com');
    });

    test('creates SemanticFormData from plain object', () => {
      const semanticForm = SemanticFormData.from({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      });
      expect(semanticForm.get('name')).toBe('John Doe');
      expect(semanticForm.get('email')).toBe('john@example.com');
      expect(semanticForm.get('age')).toBe('30'); // Numbers converted to strings
    });

    test('creates SemanticFormData with context', () => {
      const semanticForm = SemanticFormData.from(
        { email: 'test@example.com' },
        'newsletter signup'
      );
      expect(semanticForm.getContext()).toBe('newsletter signup');
    });

    test('ignores null and undefined values in object', () => {
      const semanticForm = SemanticFormData.from({
        name: 'John',
        email: null,
        phone: undefined,
      });
      expect(semanticForm.get('name')).toBe('John');
      expect(semanticForm.get('email')).toBeNull();
      expect(semanticForm.get('phone')).toBeNull();
    });

    test('handles Blob values', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const semanticForm = SemanticFormData.from({
        file: blob,
        name: 'test',
      });
      expect(semanticForm.get('file')).toBeInstanceOf(Blob);
      expect(semanticForm.get('name')).toBe('test');
    });
  });

  describe('semanticallyEquals()', () => {
    test('compares FormData for semantic equivalence', async () => {
      const mockClient = createMockLLMClient({
        'form data comparison': JSON.stringify({
          equivalent: true,
          fieldMappings: { firstName: 'first_name', lastName: 'last_name' },
          confidence: 0.95,
        }),
      });

      const form1 = SemanticFormData.from(
        { firstName: 'John', lastName: 'Doe' },
        undefined,
        mockClient
      );
      const form2 = new FormData();
      form2.append('first_name', 'John');
      form2.append('last_name', 'Doe');

      const result = await form1.semanticallyEquals(form2);
      expect(result.equivalent).toBe(true);
      expect(result.fieldMappings).toEqual({
        firstName: 'first_name',
        lastName: 'last_name',
      });
      expect(result.confidence).toBe(0.95);
    });

    test('identifies non-equivalent forms', async () => {
      const mockClient = createMockLLMClient({
        'form data comparison': JSON.stringify({
          equivalent: false,
          fieldMappings: {},
          confidence: 0.9,
        }),
      });

      const form1 = SemanticFormData.from({ name: 'John' }, undefined, mockClient);
      const form2 = new FormData();
      form2.append('email', 'john@example.com');

      const result = await form1.semanticallyEquals(form2);
      expect(result.equivalent).toBe(false);
    });

    test('handles similar field names with different conventions', async () => {
      const mockClient = createMockLLMClient({
        'form data comparison': JSON.stringify({
          equivalent: true,
          fieldMappings: { emailAddress: 'user_email' },
          confidence: 0.88,
        }),
      });

      const form1 = SemanticFormData.from(
        { emailAddress: 'john@example.com' },
        undefined,
        mockClient
      );
      const form2 = new FormData();
      form2.append('user_email', 'john@example.com');

      const result = await form1.semanticallyEquals(form2);
      expect(result.equivalent).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('validate()', () => {
    test('validates form with passing rules', async () => {
      const mockClient = createMockLLMClient({
        'form validation': JSON.stringify({
          valid: true,
          issues: [],
        }),
      });

      const form = SemanticFormData.from(
        { email: 'valid@example.com', name: 'John' },
        undefined,
        mockClient
      );

      const result = await form.validate([
        'email must be valid',
        'name must not be empty',
      ]);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('validates form with failing rules', async () => {
      const mockClient = createMockLLMClient({
        'form validation': JSON.stringify({
          valid: false,
          issues: [
            { field: 'email', issue: 'Invalid email format' },
            { field: 'password', issue: 'Password is too weak' },
          ],
        }),
      });

      const form = SemanticFormData.from(
        { email: 'invalid-email', password: '123' },
        undefined,
        mockClient
      );

      const result = await form.validate([
        'email must be valid',
        'password must be strong',
      ]);
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0]?.field).toBe('email');
      expect(result.issues[1]?.field).toBe('password');
    });

    test('validates cross-field rules', async () => {
      const mockClient = createMockLLMClient({
        'form validation': JSON.stringify({
          valid: false,
          issues: [
            { field: 'confirmPassword', issue: 'Passwords do not match' },
          ],
        }),
      });

      const form = SemanticFormData.from(
        { password: 'secret123', confirmPassword: 'secret456' },
        undefined,
        mockClient
      );

      const result = await form.validate(['passwords must match']);
      expect(result.valid).toBe(false);
      expect(result.issues[0]?.issue).toContain('match');
    });
  });

  describe('semanticGet()', () => {
    test('finds field by semantic query', async () => {
      const mockClient = createMockLLMClient({
        'form field matching': JSON.stringify({
          matchedField: 'email',
          confidence: 0.95,
        }),
      });

      const form = SemanticFormData.from(
        { email: 'john@example.com', name: 'John' },
        undefined,
        mockClient
      );

      const result = await form.semanticGet("user's email address");
      expect(result.value).toBe('john@example.com');
      expect(result.matchedField).toBe('email');
      expect(result.confidence).toBe(0.95);
    });

    test('finds field with different naming convention', async () => {
      const mockClient = createMockLLMClient({
        'form field matching': JSON.stringify({
          matchedField: 'first_name',
          confidence: 0.92,
        }),
      });

      const form = SemanticFormData.from(
        { first_name: 'John', last_name: 'Doe' },
        undefined,
        mockClient
      );

      const result = await form.semanticGet('firstName');
      expect(result.value).toBe('John');
      expect(result.matchedField).toBe('first_name');
    });

    test('returns null when no match found', async () => {
      const mockClient = createMockLLMClient({
        'form field matching': JSON.stringify({
          matchedField: null,
          confidence: 0.1,
        }),
      });

      const form = SemanticFormData.from({ name: 'John' }, undefined, mockClient);

      const result = await form.semanticGet('credit card number');
      expect(result.value).toBeNull();
      expect(result.matchedField).toBeUndefined();
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('handles semantic queries for common abbreviations', async () => {
      const mockClient = createMockLLMClient({
        'form field matching': JSON.stringify({
          matchedField: 'tel',
          confidence: 0.88,
        }),
      });

      const form = SemanticFormData.from(
        { tel: '555-1234', addr: '123 Main St' },
        undefined,
        mockClient
      );

      const result = await form.semanticGet('telephone number');
      expect(result.value).toBe('555-1234');
      expect(result.matchedField).toBe('tel');
    });
  });

  describe('inferPurpose()', () => {
    test('infers user registration form purpose', async () => {
      const mockClient = createMockLLMClient({
        'form analysis': JSON.stringify({
          purpose: 'user-registration',
          requiredFields: ['email', 'password', 'name'],
          confidence: 0.92,
        }),
      });

      const form = SemanticFormData.from(
        { email: 'john@example.com', password: 'secret', name: 'John' },
        undefined,
        mockClient
      );

      const result = await form.inferPurpose();
      expect(result.purpose).toBe('user-registration');
      expect(result.requiredFields).toContain('email');
      expect(result.requiredFields).toContain('password');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('infers login form purpose', async () => {
      const mockClient = createMockLLMClient({
        'form analysis': JSON.stringify({
          purpose: 'login',
          requiredFields: ['email', 'password'],
          confidence: 0.95,
        }),
      });

      const form = SemanticFormData.from(
        { email: 'user@example.com', password: 'secret' },
        undefined,
        mockClient
      );

      const result = await form.inferPurpose();
      expect(result.purpose).toBe('login');
      expect(result.requiredFields).toHaveLength(2);
    });

    test('infers contact form purpose', async () => {
      const mockClient = createMockLLMClient({
        'form analysis': JSON.stringify({
          purpose: 'contact',
          requiredFields: ['name', 'email', 'message'],
          confidence: 0.88,
        }),
      });

      const form = SemanticFormData.from(
        { name: 'John', email: 'john@example.com', message: 'Hello!' },
        undefined,
        mockClient
      );

      const result = await form.inferPurpose();
      expect(result.purpose).toBe('contact');
    });

    test('infers checkout form purpose', async () => {
      const mockClient = createMockLLMClient({
        'form analysis': JSON.stringify({
          purpose: 'checkout',
          requiredFields: ['cardNumber', 'expiryDate', 'cvv', 'billingAddress'],
          confidence: 0.91,
        }),
      });

      const form = SemanticFormData.from(
        {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          billingAddress: '123 Main St',
        },
        undefined,
        mockClient
      );

      const result = await form.inferPurpose();
      expect(result.purpose).toBe('checkout');
    });
  });

  describe('detectSensitive()', () => {
    test('detects sensitive authentication data', async () => {
      const mockClient = createMockLLMClient({
        'data sensitivity analyst': JSON.stringify({
          hasSensitive: true,
          fields: ['password', 'ssn'],
          recommendation: 'Use HTTPS and encrypt at rest',
        }),
      });

      const form = SemanticFormData.from(
        { email: 'user@example.com', password: 'secret', ssn: '123-45-6789' },
        undefined,
        mockClient
      );

      const result = await form.detectSensitive();
      expect(result.hasSensitive).toBe(true);
      expect(result.fields).toContain('password');
      expect(result.fields).toContain('ssn');
      expect(result.recommendation).toContain('HTTPS');
    });

    test('detects financial data', async () => {
      const mockClient = createMockLLMClient({
        'data sensitivity analyst': JSON.stringify({
          hasSensitive: true,
          fields: ['creditCard', 'bankAccount'],
          recommendation: 'Use PCI-DSS compliant storage',
        }),
      });

      const form = SemanticFormData.from(
        { creditCard: '4111111111111111', bankAccount: '123456789' },
        undefined,
        mockClient
      );

      const result = await form.detectSensitive();
      expect(result.hasSensitive).toBe(true);
      expect(result.fields).toContain('creditCard');
    });

    test('reports no sensitive data for simple forms', async () => {
      const mockClient = createMockLLMClient({
        'data sensitivity analyst': JSON.stringify({
          hasSensitive: false,
          fields: [],
          recommendation: 'No special handling required',
        }),
      });

      const form = SemanticFormData.from(
        { searchQuery: 'typescript tutorials' },
        undefined,
        mockClient
      );

      const result = await form.detectSensitive();
      expect(result.hasSensitive).toBe(false);
      expect(result.fields).toHaveLength(0);
    });
  });

  describe('suggestMissingFields()', () => {
    test('suggests password confirmation for registration form', async () => {
      const mockClient = createMockLLMClient({
        'form analysis': JSON.stringify({
          purpose: 'user-registration',
          requiredFields: ['email', 'password', 'confirmPassword'],
          confidence: 0.92,
        }),
        'form design': JSON.stringify({
          suggestions: [
            {
              field: 'confirmPassword',
              reason: 'Registration forms typically require password confirmation',
              required: true,
            },
            {
              field: 'termsAccepted',
              reason: 'Users should accept terms of service',
              required: true,
            },
          ],
        }),
      });

      const form = SemanticFormData.from(
        { email: 'john@example.com', password: 'secret', name: 'John' },
        undefined,
        mockClient
      );

      const result = await form.suggestMissingFields();
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.field === 'confirmPassword')).toBe(true);
    });

    test('suggests CAPTCHA for contact form', async () => {
      const mockClient = createMockLLMClient({
        'form analysis': JSON.stringify({
          purpose: 'contact',
          requiredFields: ['name', 'email', 'message'],
          confidence: 0.88,
        }),
        'form design': JSON.stringify({
          suggestions: [
            {
              field: 'captcha',
              reason: 'Helps prevent spam submissions',
              required: false,
            },
          ],
        }),
      });

      const form = SemanticFormData.from(
        { name: 'John', email: 'john@example.com', message: 'Hello' },
        undefined,
        mockClient
      );

      const result = await form.suggestMissingFields();
      expect(result.some((s) => s.field === 'captcha')).toBe(true);
    });

    test('returns empty suggestions for complete form', async () => {
      const mockClient = createMockLLMClient({
        'form analysis': JSON.stringify({
          purpose: 'newsletter-signup',
          requiredFields: ['email'],
          confidence: 0.95,
        }),
        'form design': JSON.stringify({
          suggestions: [],
        }),
      });

      const form = SemanticFormData.from({ email: 'user@example.com' }, undefined, mockClient);

      const result = await form.suggestMissingFields();
      expect(result).toHaveLength(0);
    });

    test('uses provided context for purpose', async () => {
      const mockClient = createMockLLMClient({
        'form design': JSON.stringify({
          suggestions: [
            {
              field: 'promoCode',
              reason: 'Checkout forms often include promo code field',
              required: false,
            },
          ],
        }),
      });

      const form = SemanticFormData.from(
        { cardNumber: '4111111111111111', amount: '99.99' },
        'checkout',
        mockClient
      );

      const result = await form.suggestMissingFields();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('validateFiles()', () => {
    test('validates files within size limit', async () => {
      const mockClient = createMockLLMClient({
        'file validation': JSON.stringify({
          valid: true,
          issues: [],
        }),
      });

      const formData = new FormData();
      const file = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      formData.append('document', file);

      const form = new SemanticFormData(formData, undefined, mockClient);

      const result = await form.validateFiles({
        maxSize: '10MB',
        allowedTypes: ['application/pdf'],
      });
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('rejects files exceeding size limit', async () => {
      const mockClient = createMockLLMClient({
        'file validation': JSON.stringify({
          valid: false,
          issues: [{ field: 'largeFile', issue: 'File size exceeds 5MB limit' }],
        }),
      });

      const formData = new FormData();
      const file = new File(['x'.repeat(10000000)], 'large.pdf', {
        type: 'application/pdf',
      });
      formData.append('largeFile', file);

      const form = new SemanticFormData(formData, undefined, mockClient);

      const result = await form.validateFiles({ maxSize: '5MB' });
      expect(result.valid).toBe(false);
      expect(result.issues[0]?.issue).toContain('size');
    });

    test('rejects files with invalid types', async () => {
      const mockClient = createMockLLMClient({
        'file validation': JSON.stringify({
          valid: false,
          issues: [
            { field: 'upload', issue: 'File type text/plain is not allowed' },
          ],
        }),
      });

      const formData = new FormData();
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      formData.append('upload', file);

      const form = new SemanticFormData(formData, undefined, mockClient);

      const result = await form.validateFiles({
        allowedTypes: ['image/*', 'application/pdf'],
      });
      expect(result.valid).toBe(false);
      expect(result.issues[0]?.issue).toContain('type');
    });

    test('returns valid for form with no files', async () => {
      const form = SemanticFormData.from({ name: 'John' });

      const result = await form.validateFiles({ maxSize: '5MB' });
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('validates multiple files', async () => {
      const mockClient = createMockLLMClient({
        'file validation': JSON.stringify({
          valid: false,
          issues: [
            { field: 'file2', issue: 'File type application/exe is not allowed' },
          ],
        }),
      });

      const formData = new FormData();
      formData.append(
        'file1',
        new File(['test'], 'doc.pdf', { type: 'application/pdf' })
      );
      formData.append(
        'file2',
        new File(['test'], 'app.exe', { type: 'application/exe' })
      );

      const form = new SemanticFormData(formData, undefined, mockClient);

      const result = await form.validateFiles({
        allowedTypes: ['application/pdf', 'image/*'],
      });
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
    });
  });

  describe('explain()', () => {
    test('explains registration form', async () => {
      const mockClient = createMockLLMClient({
        'form description': JSON.stringify({
          explanation:
            'User registration form collecting name, email, and password for account creation',
        }),
      });

      const form = SemanticFormData.from(
        { name: 'John', email: 'john@example.com', password: 'secret' },
        undefined,
        mockClient
      );

      const result = await form.explain();
      expect(result).toContain('registration');
      expect(result).toContain('email');
    });

    test('explains contact form', async () => {
      const mockClient = createMockLLMClient({
        'form description': JSON.stringify({
          explanation:
            'Contact form for users to send messages with their name and email',
        }),
      });

      const form = SemanticFormData.from(
        { name: 'John', email: 'john@example.com', message: 'Hello!' },
        undefined,
        mockClient
      );

      const result = await form.explain();
      expect(result).toContain('Contact');
    });

    test('explains file upload form', async () => {
      const mockClient = createMockLLMClient({
        'form description': JSON.stringify({
          explanation: 'Document upload form with title and file attachment',
        }),
      });

      const formData = new FormData();
      formData.append('title', 'My Document');
      formData.append(
        'document',
        new File(['content'], 'doc.pdf', { type: 'application/pdf' })
      );

      const form = new SemanticFormData(formData, undefined, mockClient);

      const result = await form.explain();
      expect(result).toContain('upload');
    });

    test('uses context in explanation', async () => {
      const mockClient = createMockLLMClient({
        'form description': JSON.stringify({
          explanation:
            'Newsletter subscription form for weekly updates sign-up',
        }),
      });

      const form = SemanticFormData.from(
        { email: 'user@example.com' },
        'newsletter subscription',
        mockClient
      );

      const result = await form.explain();
      expect(result.toLowerCase()).toContain('newsletter');
    });
  });

  describe('toObject()', () => {
    test('converts to camelCase object', async () => {
      const mockClient = createMockLLMClient({
        'naming convention': JSON.stringify({
          mappings: {
            first_name: 'firstName',
            last_name: 'lastName',
            email_address: 'emailAddress',
          },
        }),
      });

      const form = SemanticFormData.from(
        { first_name: 'John', last_name: 'Doe', email_address: 'john@example.com' },
        undefined,
        mockClient
      );

      const result = await form.toObject('camelCase');
      expect(result['firstName']).toBe('John');
      expect(result['lastName']).toBe('Doe');
      expect(result['emailAddress']).toBe('john@example.com');
    });

    test('converts to snake_case object', async () => {
      const mockClient = createMockLLMClient({
        'naming convention': JSON.stringify({
          mappings: {
            firstName: 'first_name',
            lastName: 'last_name',
          },
        }),
      });

      const form = SemanticFormData.from(
        { firstName: 'John', lastName: 'Doe' },
        undefined,
        mockClient
      );

      const result = await form.toObject('snake_case');
      expect(result['first_name']).toBe('John');
      expect(result['last_name']).toBe('Doe');
    });

    test('defaults to camelCase', async () => {
      const mockClient = createMockLLMClient({
        'naming convention': JSON.stringify({
          mappings: {
            user_name: 'userName',
          },
        }),
      });

      const form = SemanticFormData.from({ user_name: 'johndoe' }, undefined, mockClient);

      const result = await form.toObject();
      expect(result['userName']).toBe('johndoe');
    });
  });

  describe('valueOf()', () => {
    test('returns the underlying FormData', () => {
      const formData = new FormData();
      formData.append('test', 'value');
      const semanticForm = new SemanticFormData(formData);

      const result = semanticForm.valueOf();
      expect(result).toBeInstanceOf(FormData);
      expect(result.get('test')).toBe('value');
    });

    test('returns the same FormData instance', () => {
      const formData = new FormData();
      const semanticForm = new SemanticFormData(formData);
      expect(semanticForm.valueOf()).toBe(formData);
    });
  });

  describe('FormData delegation methods', () => {
    test('append adds values', () => {
      const form = SemanticFormData.from({});
      form.append('name', 'John');
      form.append('name', 'Jane');
      expect(form.getAll('name')).toEqual(['John', 'Jane']);
    });

    test('set replaces values', () => {
      const form = SemanticFormData.from({ name: 'John' });
      form.set('name', 'Jane');
      expect(form.get('name')).toBe('Jane');
      expect(form.getAll('name')).toHaveLength(1);
    });

    test('delete removes values', () => {
      const form = SemanticFormData.from({ name: 'John', email: 'john@example.com' });
      form.delete('name');
      expect(form.has('name')).toBe(false);
      expect(form.has('email')).toBe(true);
    });

    test('has checks for field existence', () => {
      const form = SemanticFormData.from({ name: 'John' });
      expect(form.has('name')).toBe(true);
      expect(form.has('email')).toBe(false);
    });

    test('keys returns all unique keys', () => {
      const form = SemanticFormData.from({ name: 'John', email: 'john@example.com' });
      const keys = [...form.keys()];
      expect(keys).toContain('name');
      expect(keys).toContain('email');
    });

    test('values returns all values', () => {
      const form = SemanticFormData.from({ name: 'John', email: 'john@example.com' });
      const values = [...form.values()];
      expect(values).toContain('John');
      expect(values).toContain('john@example.com');
    });

    test('entries returns all entries', () => {
      const form = SemanticFormData.from({ name: 'John' });
      const entries = [...form.entries()];
      expect(entries).toContainEqual(['name', 'John']);
    });

    test('forEach iterates over entries', () => {
      const form = SemanticFormData.from({ name: 'John', email: 'john@example.com' });
      const collected: string[] = [];
      form.forEach((value) => {
        if (typeof value === 'string') {
          collected.push(value);
        }
      });
      expect(collected).toContain('John');
      expect(collected).toContain('john@example.com');
    });

    test('getFieldNames returns unique field names', () => {
      const formData = new FormData();
      formData.append('name', 'John');
      formData.append('name', 'Jane'); // Duplicate key
      formData.append('email', 'test@example.com');

      const form = new SemanticFormData(formData);
      const names = form.getFieldNames();

      expect(names).toContain('name');
      expect(names).toContain('email');
      expect(names.filter((n) => n === 'name')).toHaveLength(1); // Only one 'name'
    });
  });

  describe('File handling', () => {
    test('handles File objects in FormData', () => {
      const formData = new FormData();
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('document', file);

      const form = new SemanticFormData(formData);
      const retrieved = form.get('document');

      expect(retrieved).toBeInstanceOf(File);
      if (retrieved instanceof File) {
        expect(retrieved.name).toBe('test.pdf');
        expect(retrieved.type).toBe('application/pdf');
      }
    });

    test('append with filename for Blob', () => {
      const form = SemanticFormData.from({});
      const blob = new Blob(['test'], { type: 'text/plain' });
      form.append('file', blob, 'custom.txt');

      const retrieved = form.get('file');
      expect(retrieved).toBeInstanceOf(Blob);
    });

    test('set with filename for Blob', () => {
      const form = SemanticFormData.from({});
      const blob = new Blob(['test'], { type: 'text/plain' });
      form.set('file', blob, 'custom.txt');

      const retrieved = form.get('file');
      expect(retrieved).toBeInstanceOf(Blob);
    });
  });
});
