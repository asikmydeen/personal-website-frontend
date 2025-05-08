import React, { useEffect } from "react";
import { Form, Input, Button } from "antd";
import { DialogClose } from "../../components/ui/dialog";
import { addCard, updateCard } from "../../services/digitalWalletService";

// This component is used inside the Dialog in WalletDashboardPage
const AddEditCardComponent = ({ onSubmit, loading, initialData, isEdit, onCancel }) => {
  const [form] = Form.useForm();

  // Handle form initialization with initialData prop
  useEffect(() => {
    if (initialData && initialData.id) {
      form.setFieldsValue({
        cardholderName: initialData.cardholderName || "",
        cardNumber: "", // Don't show sensitive data in edit mode
        expiryDate: initialData.expiryDate || "",
        cvv: "", // Don't show sensitive data in edit mode
        cardType: initialData.cardType || initialData.issuer || "",
        billingAddress: initialData.billingAddress?.line1 || "",
        notes: initialData.notes || "",
      });
    } else {
      form.resetFields();
    }
  }, [initialData, form]);

  // Handle form submission
  const handleFinish = async (values) => {
    if (onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        cardholderName: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardType: "",
        billingAddress: "",
        notes: "",
      }}
    >
      <Form.Item
        label="Cardholder Name"
        name="cardholderName"
        rules={[{ required: true, message: "Please enter the cardholder name" }]}
      >
        <Input placeholder="John M. Doe" />
      </Form.Item>

      <Form.Item
        label="Card Number"
        name="cardNumber"
        rules={[
          { required: !isEdit, message: "Please enter the card number" },
          { pattern: /^[0-9\s]{13,19}$/, message: "Invalid card number" },
        ]}
      >
        <Input placeholder="•••• •••• •••• ••••" maxLength={19} />
      </Form.Item>

      <Form.Item
        label="Expiry Date (MM/YY)"
        name="expiryDate"
        rules={[
          { required: true, message: "Please enter the expiry date" },
          { pattern: /^(0[1-9]|1[0-2])\/([0-9]{2})$/, message: "Expiry date must be in MM/YY format" },
        ]}
      >
        <Input placeholder="MM/YY" maxLength={5} />
      </Form.Item>

      <Form.Item
        label="CVV/CVC"
        name="cvv"
        rules={[
          { required: !isEdit, message: "Please enter the CVV/CVC" },
          { pattern: /^[0-9]{3,4}$/, message: "Invalid CVV/CVC" },
        ]}
      >
        <Input placeholder="•••" maxLength={4} />
      </Form.Item>

      <Form.Item label="Card Type (Optional)" name="cardType">
        <Input placeholder="e.g., Visa, Mastercard" />
      </Form.Item>

      <Form.Item label="Billing Address (Optional)" name="billingAddress">
        <Input.TextArea rows={2} placeholder="123 Main St, Anytown, USA" />
      </Form.Item>

      <Form.Item label="Notes (Optional)" name="notes">
        <Input.TextArea rows={2} placeholder="e.g., For online purchases only" />
      </Form.Item>

      <Form.Item>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" disabled={loading}>
            {isEdit ? "Save Changes" : "Add Card"}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default AddEditCardComponent;
