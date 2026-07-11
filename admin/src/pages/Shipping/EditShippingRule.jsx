import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Card, CardBody, Input, Button, Label, Select } from '@windmill/react-ui';
import PageTitle from '@/components/Typography/PageTitle';
import { useUpdateShippingRuleMutation, useGetShippingRuleByIdQuery } from '@/reduxStore/slice/shippingApiSlice';
import { toast } from 'react-toastify';

const EditShippingRule = () => {
  const history = useHistory();
  const { id } = useParams();
  
  const { data, isLoading: isFetching } = useGetShippingRuleByIdQuery(id);
  const [updateRule, { isLoading }] = useUpdateShippingRuleMutation();
  
  const [formData, setFormData] = useState({
    ruleType: 'both',
    startKm: '',
    endKm: '',
    startOrderPrice: '',
    endOrderPrice: '',
    shippingCharge: '',
    status: 'active'
  });

  useEffect(() => {
    if (data && data.data) {
      const rule = data.data;
      setFormData({
        ruleType: rule.ruleType || 'both',
        startKm: rule.startKm ?? '',
        endKm: rule.endKm ?? '',
        startOrderPrice: rule.startOrderPrice ?? '',
        endOrderPrice: rule.endOrderPrice ?? '',
        shippingCharge: rule.shippingCharge ?? '',
        status: rule.status || 'active'
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
      const payload = {
        id,
        ruleType: formData.ruleType,
        shippingCharge: Number(formData.shippingCharge),
        status: formData.status
      };

      if (formData.ruleType === 'distance' || formData.ruleType === 'both') {
        payload.startKm = Number(formData.startKm);
        payload.endKm = Number(formData.endKm);
      }
      if (formData.ruleType === 'order' || formData.ruleType === 'both') {
        payload.startOrderPrice = Number(formData.startOrderPrice);
        payload.endOrderPrice = Number(formData.endOrderPrice);
      }

      await updateRule(payload).unwrap();
      toast.success('Shipping rule updated successfully');
      history.push('/shipping-rules-list');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update rule');
    }
  };

  if (isFetching) return <div>Loading...</div>;

  return (
    <>
      <PageTitle>Edit Shipping Rule</PageTitle>
      <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Label>
              <span>Rule Type</span>
              <Select className="mt-1" name="ruleType" value={formData.ruleType} onChange={handleChange}>
                <option value="distance">Distance</option>
                <option value="order">Order Price</option>
                <option value="both">Distance + Order Price</option>
              </Select>
            </Label>

            {(formData.ruleType === 'distance' || formData.ruleType === 'both') && (
              <div className="flex gap-4">
                <Label className="flex-1">
                  <span>Start KM</span>
                  <Input className="mt-1" type="number" step="any" name="startKm" value={formData.startKm} onChange={handleChange} required />
                </Label>
                <Label className="flex-1">
                  <span>End KM</span>
                  <Input className="mt-1" type="number" step="any" name="endKm" value={formData.endKm} onChange={handleChange} required />
                </Label>
              </div>
            )}

            {(formData.ruleType === 'order' || formData.ruleType === 'both') && (
              <div className="flex gap-4">
                <Label className="flex-1">
                  <span>Start Order Price (₹)</span>
                  <Input className="mt-1" type="number" step="any" name="startOrderPrice" value={formData.startOrderPrice} onChange={handleChange} required />
                </Label>
                <Label className="flex-1">
                  <span>End Order Price (₹)</span>
                  <Input className="mt-1" type="number" step="any" name="endOrderPrice" value={formData.endOrderPrice} onChange={handleChange} required />
                </Label>
              </div>
            )}

            <Label>
              <span>Shipping Charge (₹)</span>
              <Input className="mt-1" type="number" step="any" name="shippingCharge" value={formData.shippingCharge} onChange={handleChange} required />
            </Label>

            <Label>
              <span>Status</span>
              <Select className="mt-1" name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Label>

            <div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Rule'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
};

export default EditShippingRule;
