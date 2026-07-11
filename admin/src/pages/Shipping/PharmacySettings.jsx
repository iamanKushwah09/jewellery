import React, { useState, useEffect } from 'react';
import { Card, CardBody, Input, Button, Label } from '@windmill/react-ui';
import PageTitle from '@/components/Typography/PageTitle';
import { useGetStoreSettingsQuery, useUpdateStoreSettingsMutation } from '@/reduxStore/slice/shippingApiSlice';
import { toast } from 'react-toastify';

const StoreSettings = () => {
  const { data, isLoading } = useGetStoreSettingsQuery();
  const [updatePharmacy, { isLoading: isUpdating }] = useUpdateStoreSettingsMutation();
  const [formData, setFormData] = useState({
    officeName: '',
    officeAddress: '',
    officeLatitude: '',
    officeLongitude: ''
  });

  useEffect(() => {
    if (data && data.data) {
      setFormData({
        officeName: data.data.officeName || '',
        officeAddress: data.data.officeAddress || '',
        officeLatitude: data.data.officeLatitude || '',
        officeLongitude: data.data.officeLongitude || ''
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePharmacy({
        ...formData,
        officeLatitude: Number(formData.officeLatitude),
        officeLongitude: Number(formData.officeLongitude)
      }).unwrap();
      toast.success('Store Location updated successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update Store Location');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <PageTitle>Store Location Settings</PageTitle>
      <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Label>
              <span>Office Name</span>
              <Input className="mt-1" name="officeName" value={formData.officeName} onChange={handleChange} required />
            </Label>
            <Label>
              <span>Office Address</span>
              <Input className="mt-1" name="officeAddress" value={formData.officeAddress} onChange={handleChange} required />
            </Label>
            <Label>
              <span>Latitude</span>
              <Input className="mt-1" type="number" step="any" name="officeLatitude" value={formData.officeLatitude} onChange={handleChange} required />
            </Label>
            <Label>
              <span>Longitude</span>
              <Input className="mt-1" type="number" step="any" name="officeLongitude" value={formData.officeLongitude} onChange={handleChange} required />
            </Label>
            <div>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Location'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
};

export default StoreSettings;
