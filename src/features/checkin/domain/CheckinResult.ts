export interface CheckinAttendee {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  email: string;
  invitationCode: string | null;
  checkedIn: boolean;
  checkedInAt: Date | null;
}
