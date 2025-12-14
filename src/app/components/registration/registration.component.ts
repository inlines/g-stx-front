import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RegistrationActions } from '@app/states/registration/states/registration-actions';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgClass]
})
export class RegistrationComponent {
  constructor(
    private readonly fb: FormBuilder,
    private readonly store: Store,
  ) {
    this.form  = this.fb.group({
      user_login: new FormControl("", [
        Validators.required,
        this.latinAndNumbersValidator.bind(this)
      ]),
      password: new FormControl("", Validators.required),
      passwordAgain: new FormControl("", Validators.required),
    }, { validators: this.passwordsMatchValidator });
  }

  private passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm = form.get('passwordAgain')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  private latinAndNumbersValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    // Разрешаем латинские буквы и цифры
    const latinWithNumbersRegex = /^[a-zA-Z0-9]+$/;
    
    if (!latinWithNumbersRegex.test(control.value)) {
      return { latinAndNumbersOnly: true };
    }
    
    return null;
  }

  public form!: FormGroup;

  public submit() : void {
    if(!this.form.invalid) {
      this.store.dispatch(new RegistrationActions.RegisterRequest(this.form.value));
    }
  }
}
