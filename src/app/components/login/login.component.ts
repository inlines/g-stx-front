import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthActions } from '@app/states/auth/states/auth-actions';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgClass, RouterLink]
})
export class LoginComponent {
  constructor(
    private readonly fb: FormBuilder,
    private readonly store: Store,
  ) {
    this.form  = this.fb.group({
      user_login: new FormControl("", [
            Validators.required, 
      ]),
      password: new FormControl("", Validators.required),
    });
  }

  public form!: FormGroup;

  public submit() : void {
    if(!this.form.invalid) {
      this.store.dispatch(new AuthActions.LoginRequest(this.form.value));
    }
  }
}
