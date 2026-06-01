import { useState, useEffect } from 'react';

interface Option {
  id: number;
  name: string;
  color?: string;
}

interface CreateFormField {
  name: 'name' | 'color';
  label: string;
  type: 'text' | 'color';
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}

interface InlineCreateSelectProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  options: Option[];
  disabled?: boolean;
  onCreateNew: (data: { name: string; color?: string }) => Promise<number>;
  onRefresh: () => Promise<void>;
  createLabel?: string;
  emptyLabel?: string;
  formFields?: CreateFormField[];
  requiresParent?: boolean;
  parentSelected?: boolean;
  parentMessage?: string;
}

export function InlineCreateSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  onCreateNew,
  onRefresh,
  createLabel = 'Create New',
  emptyLabel = 'None',
  formFields = [{ name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter name' }],
  requiresParent = false,
  parentSelected = true,
  parentMessage = 'Please select a group first',
}: InlineCreateSelectProps) {
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    color: '#667eea',
  });

  useEffect(() => {
    // Reset form when modal closes
    if (!showModal) {
      setFormData({ name: '', color: '#667eea' });
    }
  }, [showModal]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === '__create_new__') {
      // Check if parent is required
      if (requiresParent && !parentSelected) {
        alert(parentMessage);
        // Reset select to current value
        e.target.value = value?.toString() || '';
        return;
      }
      setShowModal(true);
    } else {
      onChange(selectedValue ? parseInt(selectedValue) : null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const nameField = formFields.find(f => f.name === 'name');
    if (nameField?.required && !formData.name.trim()) {
      alert('Name is required');
      return;
    }

    setCreating(true);
    try {
      const createData: { name: string; color?: string } = { name: formData.name.trim() };
      
      // Add color if it's in the form fields
      if (formFields.some(f => f.name === 'color')) {
        createData.color = formData.color;
      }

      const newId = await onCreateNew(createData);
      await onRefresh();
      onChange(newId);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to create:', err);
      alert(`Failed to create: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <select
          value={value ?? ''}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          disabled={disabled}
        >
          <option value="">— {emptyLabel} —</option>
          <option value="__create_new__" className="text-indigo-600 font-semibold">
            + {createLabel}
          </option>
          <option disabled>—————————</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {createLabel}
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {formFields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {field.label} {field.required && '*'}
                  </label>
                  {field.type === 'text' ? (
                    <input
                      type="text"
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : field.type === 'color' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData[field.name] || field.defaultValue || '#667eea'}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={formData[field.name] || field.defaultValue || '#667eea'}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        placeholder="#667eea"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
