import { useCallback, useMemo, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useDropzone } from 'react-dropzone';
import { compressImageFile } from '../../utils/imageCompression.js';
import { formatBytes } from '../../utils/formatters.js';

function Step7DocumentsSignature({ form }) {
  const { setValue, watch, formState } = form;
  const signatureRef = useRef(null);
  const [files, setFiles] = useState(watch('documents') || []);
  const [uploadError, setUploadError] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploadError('');
    const processed = await Promise.all(
      acceptedFiles.map(async (file) => {
        if (file.type.startsWith('image/')) {
          const compressed = await compressImageFile(file);
          return {
            name: file.name,
            type: file.type,
            originalSize: file.size,
            compressedSize: compressed.size,
            dataUrl: await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(compressed);
            }),
          };
        }
        return {
          name: file.name,
          type: file.type,
          originalSize: file.size,
          compressedSize: file.size,
          dataUrl: await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          }),
        };
      })
    );
    const updated = [...files, ...processed];
    setFiles(updated);
    setValue('documents', updated);
  }, [files, setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'application/pdf': ['.pdf'] },
    maxFiles: 5,
  });

  const signatureDataUrl = useMemo(() => {
    const dataUrl = signatureRef.current?.getTrimmedCanvas().toDataURL();
    return dataUrl && dataUrl !== 'data:,undefined' ? dataUrl : '';
  }, [signatureRef.current]);

  function handleClearSignature() {
    signatureRef.current?.clear();
    setValue('signature', '');
  }

  function handleSaveSignature() {
    const dataUrl = signatureRef.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl && dataUrl !== 'data:,') {
      setValue('signature', dataUrl);
      return;
    }
    setValue('signature', '');
  }

  return (
    <div className="wizard-panel">
      <div className="field-grid upload-grid">
        <div className="dropzone" {...getRootProps()}>
          <input {...getInputProps()} />
          <p>{isDragActive ? 'Drop files here' : 'Drag & drop PAN, Aadhaar, or income docs here'}</p>
          <small>Accepted: JPG, PNG, PDF. Maximum 2MB after compression for images.</small>
        </div>

        {uploadError && <p className="error-message">{uploadError}</p>}

        <div className="upload-list">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="upload-item">
              <strong>{file.name}</strong>
              <span>{formatBytes(file.originalSize)} → {formatBytes(file.compressedSize)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="signature-panel">
        <label className="field full-width">
          <span>Draw your e-signature</span>
          <div className="signature-box">
            <SignatureCanvas
              ref={signatureRef}
              penColor="#0a2540"
              canvasProps={{ className: 'signature-canvas' }}
              onEnd={handleSaveSignature}
            />
          </div>
          <div className="signature-actions">
            <button className="btn btn-outline" type="button" onClick={handleClearSignature}>
              Clear
            </button>
            <button className="btn btn-secondary" type="button" onClick={handleSaveSignature}>
              Save signature
            </button>
          </div>
          {formState.errors.signature && <small className="error-message">{formState.errors.signature.message}</small>}
          {signatureDataUrl && <img className="signature-preview" src={signatureDataUrl} alt="Saved signature preview" />}
        </label>
      </div>
    </div>
  );
}

export default Step7DocumentsSignature;
