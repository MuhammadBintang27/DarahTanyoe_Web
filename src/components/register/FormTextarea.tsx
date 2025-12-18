import React from 'react';

interface FormTextareaProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  id,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  rows = 4,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label htmlFor={id} className="font-bold text-primary">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none ${
          error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-gray-300'
        }`}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};
