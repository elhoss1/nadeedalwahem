import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class ContactComponent {
  formData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  submitForm(): void {
    if (!this.validateForm()) {
      this.submitError = 'يرجى ملء جميع الحقول المطلوبة';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    // محاكاة إرسال النموذج
    setTimeout(() => {
      this.isSubmitting = false;
      this.submitSuccess = true;
      this.resetForm();

      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        this.submitSuccess = false;
      }, 3000);
    }, 1500);
  }

  validateForm(): boolean {
    return (
      this.formData.name.trim() !== '' &&
      this.formData.email.trim() !== '' &&
      this.formData.phone.trim() !== '' &&
      this.formData.subject.trim() !== '' &&
      this.formData.message.trim() !== ''
    );
  }

  resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
  }
}
