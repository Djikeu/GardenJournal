import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import '../../PlantRequestForm.css';

const PlantRequestForm = ({ showNotification, onSuccess, user: propUser }) => {
    const [currentUser, setCurrentUser] = useState(propUser || null);
    const [formData, setFormData] = useState({
        common_name: '',
        scientific_name: '',
        family: '',
        genus: '',
        description: '',
        care_instructions: {
            watering: '',
            sunlight: '',
            temperature: '',
            humidity: '',
            soil: '',
            fertilizer: ''
        },
        difficulty_level: 'beginner',
        growth_rate: 'medium',
        max_height: '',
        bloom_time: '',
        is_indoor: true,
        is_outdoor: false,
        poisonous: false,
        additional_info: ''
    });

    const [images, setImages] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        if (!currentUser) {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                setCurrentUser(JSON.parse(savedUser));
            }
        }
    }, [currentUser]);

    const difficultyLevels = [
        { value: 'beginner', label: 'Beginner', color: '#2ecc71' },
        { value: 'intermediate', label: 'Intermediate', color: '#f39c12' },
        { value: 'advanced', label: 'Advanced', color: '#e74c3c' }
    ];

    const growthRates = [
        { value: 'slow', label: 'Slow' },
        { value: 'medium', label: 'Medium' },
        { value: 'fast', label: 'Fast' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const maxFiles = 5;

        if (images.length + files.length > maxFiles) {
            showNotification('Error', `Maximum ${maxFiles} images allowed`, 'error');
            return;
        }

        for (const file of files) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const maxSize = 5 * 1024 * 1024;

            if (!validTypes.includes(file.type)) {
                showNotification('Error', `${file.name} is not a valid image type`, 'error');
                return;
            }

            if (file.size > maxSize) {
                showNotification('Error', `${file.name} is too large (max 5MB)`, 'error');
                return;
            }
        }

        setImages(prev => [...prev, ...files]);
        const newPreviewUrls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.common_name.trim()) {
            showNotification('Error', 'Plant common name is required', 'error');
            return;
        }

        if (!formData.scientific_name.trim()) {
            showNotification('Error', 'Plant scientific name is required', 'error');
            return;
        }

        if (images.length === 0) {
            showNotification('Error', 'Please upload at least one image', 'error');
            return;
        }

        try {
            setLoading(true);

            const submitFormData = new FormData();
            submitFormData.append('common_name', formData.common_name);
            submitFormData.append('scientific_name', formData.scientific_name);
            submitFormData.append('family', formData.family);
            submitFormData.append('genus', formData.genus);
            submitFormData.append('description', formData.description);
            submitFormData.append('care_instructions', JSON.stringify(formData.care_instructions));
            submitFormData.append('difficulty_level', formData.difficulty_level);
            submitFormData.append('growth_rate', formData.growth_rate);
            submitFormData.append('max_height', formData.max_height);
            submitFormData.append('bloom_time', formData.bloom_time);
            submitFormData.append('is_indoor', formData.is_indoor);
            submitFormData.append('is_outdoor', formData.is_outdoor);
            submitFormData.append('poisonous', formData.poisonous);
            submitFormData.append('additional_info', formData.additional_info);

            images.forEach((image, index) => {
                submitFormData.append(`images[]`, image);
            });

            const response = await apiService.submitPlantRequest(submitFormData);

            if (response.success) {
                showNotification('Success', 'Plant request submitted successfully! Admin will review it.', 'success');
                setFormData({
                    common_name: '',
                    scientific_name: '',
                    family: '',
                    genus: '',
                    description: '',
                    care_instructions: {
                        watering: '',
                        sunlight: '',
                        temperature: '',
                        humidity: '',
                        soil: '',
                        fertilizer: ''
                    },
                    difficulty_level: 'beginner',
                    growth_rate: 'medium',
                    max_height: '',
                    bloom_time: '',
                    is_indoor: true,
                    is_outdoor: false,
                    poisonous: false,
                    additional_info: ''
                });
                setImages([]);
                setPreviewUrls([]);
                setCurrentStep(1);

                if (onSuccess) onSuccess();
            } else {
                throw new Error(response.message || 'Submission failed');
            }
        } catch (error) {
            showNotification('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="plant-request-container">
            <div className="request-header">
                <h2>
                    <i className="fas fa-seedling"></i>
                    Suggest New Plant
                </h2>
                <p>Help us grow our plant encyclopedia by suggesting new plants</p>
            </div>

            <div className="progress-steps">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-label">Basic Info</div>
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">Care Instructions</div>
                </div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <div className="step-label">Images & Submit</div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="plant-request-form">
                {currentStep === 1 && (
                    <div className="form-section">
                        <div className="form-group">
                            <label>
                                <i className="fas fa-leaf"></i>
                                Common Name *
                            </label>
                            <input
                                type="text"
                                name="common_name"
                                value={formData.common_name}
                                onChange={handleInputChange}
                                placeholder="e.g., Monstera Deliciosa"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <i className="fas fa-microscope"></i>
                                Scientific Name *
                            </label>
                            <input
                                type="text"
                                name="scientific_name"
                                value={formData.scientific_name}
                                onChange={handleInputChange}
                                placeholder="e.g., Monstera deliciosa"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Family</label>
                                <input
                                    type="text"
                                    name="family"
                                    value={formData.family}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Araceae"
                                />
                            </div>

                            <div className="form-group">
                                <label>Genus</label>
                                <input
                                    type="text"
                                    name="genus"
                                    value={formData.genus}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Monstera"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="4"
                                placeholder="Describe the plant's appearance, characteristics, and any interesting facts..."
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Difficulty Level</label>
                                <select
                                    name="difficulty_level"
                                    value={formData.difficulty_level}
                                    onChange={handleInputChange}
                                >
                                    {difficultyLevels.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Growth Rate</label>
                                <select
                                    name="growth_rate"
                                    value={formData.growth_rate}
                                    onChange={handleInputChange}
                                >
                                    {growthRates.map(rate => (
                                        <option key={rate.value} value={rate.value}>
                                            {rate.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Max Height</label>
                                <input
                                    type="text"
                                    name="max_height"
                                    value={formData.max_height}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 3-6 feet"
                                />
                            </div>

                            <div className="form-group">
                                <label>Bloom Time</label>
                                <input
                                    type="text"
                                    name="bloom_time"
                                    value={formData.bloom_time}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Spring, Summer"
                                />
                            </div>
                        </div>

                        <div className="form-row checkboxes">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_indoor"
                                    checked={formData.is_indoor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_indoor: e.target.checked }))}
                                />
                                <span>Indoor Plant</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_outdoor"
                                    checked={formData.is_outdoor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_outdoor: e.target.checked }))}
                                />
                                <span>Outdoor Plant</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="poisonous"
                                    checked={formData.poisonous}
                                    onChange={(e) => setFormData(prev => ({ ...prev, poisonous: e.target.checked }))}
                                />
                                <span>Toxic/Poisonous</span>
                            </label>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="form-section">
                        <div className="form-group">
                            <label>
                                <i className="fas fa-tint"></i>
                                Watering Needs
                            </label>
                            <textarea
                                name="care_instructions.watering"
                                value={formData.care_instructions.watering}
                                onChange={handleInputChange}
                                rows="2"
                                placeholder="How often should it be watered? Any special watering requirements?"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <i className="fas fa-sun"></i>
                                Sunlight Requirements
                            </label>
                            <textarea
                                name="care_instructions.sunlight"
                                value={formData.care_instructions.sunlight}
                                onChange={handleInputChange}
                                rows="2"
                                placeholder="Direct sunlight, indirect, shade? How many hours?"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    <i className="fas fa-thermometer-half"></i>
                                    Temperature Range
                                </label>
                                <input
                                    type="text"
                                    name="care_instructions.temperature"
                                    value={formData.care_instructions.temperature}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 65-75°F (18-24°C)"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <i className="fas fa-tachometer-alt"></i>
                                    Humidity
                                </label>
                                <input
                                    type="text"
                                    name="care_instructions.humidity"
                                    value={formData.care_instructions.humidity}
                                    onChange={handleInputChange}
                                    placeholder="e.g., High humidity (60-80%)"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                <i className="fas fa-mountain"></i>
                                Soil Type
                            </label>
                            <textarea
                                name="care_instructions.soil"
                                value={formData.care_instructions.soil}
                                onChange={handleInputChange}
                                rows="2"
                                placeholder="Preferred soil type, pH level, drainage requirements..."
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <i className="fas fa-flask"></i>
                                Fertilizer Needs
                            </label>
                            <textarea
                                name="care_instructions.fertilizer"
                                value={formData.care_instructions.fertilizer}
                                onChange={handleInputChange}
                                rows="2"
                                placeholder="Type, frequency, and season of fertilization..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Additional Information</label>
                            <textarea
                                name="additional_info"
                                value={formData.additional_info}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="Any other important information about this plant..."
                            />
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="form-section">
                        <div className="form-group">
                            <label>
                                <i className="fas fa-images"></i>
                                Plant Images *
                            </label>
                            <div className="image-upload-area">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="image-input"
                                    id="plant-images"
                                />
                                <label htmlFor="plant-images" className="upload-label">
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    <span>Click to upload images</span>
                                    <small>Max 5 images, up to 5MB each</small>
                                </label>
                            </div>

                            {previewUrls.length > 0 && (
                                <div className="image-preview-grid">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="image-preview-item">
                                            <img src={url} alt={`Preview ${index + 1}`} />
                                            <button
                                                type="button"
                                                className="remove-image"
                                                onClick={() => removeImage(index)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="summary-box">
                            <h4>Submission Summary</h4>
                            <p><strong>Plant Name:</strong> {formData.common_name}</p>
                            <p><strong>Scientific Name:</strong> {formData.scientific_name}</p>
                            <p><strong>Difficulty:</strong> {difficultyLevels.find(l => l.value === formData.difficulty_level)?.label}</p>
                            <p><strong>Images:</strong> {images.length} image(s) selected</p>
                            <p className="info-text">
                                <i className="fas fa-info-circle"></i>
                                Our admin team will review your submission within 2-3 business days.
                            </p>
                        </div>
                    </div>
                )}

                <div className="form-navigation">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            className="btn-prev"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                        >
                            <i className="fas fa-arrow-left"></i>
                            Previous
                        </button>
                    )}

                    {currentStep < 3 ? (
                        <button
                            type="button"
                            className="btn-next"
                            onClick={() => setCurrentStep(prev => prev + 1)}
                        >
                            Next
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i>
                                    Submit Request
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default PlantRequestForm;