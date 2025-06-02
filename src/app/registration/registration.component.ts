import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule]
})
export class RegistrationComponent {
  constructor(
    private readonly fb: FormBuilder
  ) {
    this.form  = this.fb.group({
      email: new FormControl("", [
            Validators.required, 
            Validators.email
      ]),
      password: new FormControl("", Validators.required),
      passwordAgain: new FormControl("", Validators.required),
      extraContact: new FormControl(""),
    });
  }

  public form!: FormGroup;

  public submit() : void {
    
  }
}
