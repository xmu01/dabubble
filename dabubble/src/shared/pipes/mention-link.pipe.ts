import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'mentionLink',
  standalone: true,
})
export class MentionLinkPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | undefined): any {
    if (!value) return '';

    // Regulärer Ausdruck für @Vorname Nachname und #Name
    const mentionPattern = /@(\w+)\s+(\w+)/g;
    const hashtagPattern = /#(\w+)/g;

    // Verarbeite Erwähnungen mit @Vorname Nachname
    let replacedValue = value.replace(mentionPattern, (match, firstName, lastName) => {
      return `<a href="#" class="mention-link" 
              data-firstname="${firstName}" 
              data-lastname="${lastName}" style="color: rgb(63, 169, 245); text-decoration: none;">@${firstName} ${lastName}</a>`;
    });

    // Verarbeite Hashtags mit #Name
    replacedValue = replacedValue.replace(hashtagPattern, (match, name) => {
      return `<a href="#" class="hashtag-link" 
              data-name="${name}" style="color: rgb(146, 200, 62); text-decoration: none;">#${name}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(replacedValue);
  }
}
