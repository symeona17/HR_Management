import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

type Employee = {
	employee_id: number;
	first_name: string;
	last_name: string;
	department: string;
	job_title: string;
	hire_date: string;
	details: string;
	level?: string;
	trainings?: string[];
	skills?: { name: string; rating: number }[];
	bio?: string;
};

type EmployeeCardOverlayProps = {
	open: boolean;
	onClose: () => void;
	employee: Employee | null;
};

const EmployeeCardOverlay: React.FC<EmployeeCardOverlayProps> = ({ open, onClose, employee }) => {
			const modalRef = useRef<HTMLDivElement>(null);
			const router = useRouter();
		const [show, setShow] = useState(open);
		const [animateIn, setAnimateIn] = useState(false);

		useEffect(() => {
			if (open) {
				setShow(true);
				setTimeout(() => setAnimateIn(true), 10);
			} else {
				setAnimateIn(false);
				const timeout = setTimeout(() => setShow(false), 200);
				return () => clearTimeout(timeout);
			}
		}, [open]);

		useEffect(() => {
			if (!open) return;
			function handleClickOutside(event: MouseEvent) {
				if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
					onClose();
				}
			}
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}, [open, onClose]);

		if (!show && !open) return null;
		if (!employee) return null;

		// Dummy data fallback for demonstration
		const topSkills = employee.skills || [
			{ name: 'Presentation', rating: 4 },
			{ name: 'Project Management', rating: 4 },
			{ name: 'Teamwork', rating: 3 },
		];
		const trainings = employee.trainings || ['Cybersecurity: 85%'];
			const bio = employee.details || employee.bio || '';

		return (
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100vw',
					height: '100vh',
					zIndex: 1000,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					pointerEvents: open ? 'auto' : 'none',
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100vw',
						height: '100vh',
						background: 'rgba(0,0,0,0.3)',
						backdropFilter: open ? 'blur(6px)' : 'blur(0px)',
						WebkitBackdropFilter: open ? 'blur(6px)' : 'blur(0px)',
						opacity: open ? 1 : 0,
						transition: 'opacity 200ms ease, backdrop-filter 200ms ease',
						zIndex: 1000,
						pointerEvents: 'auto',
					}}
				/>
				<div
					ref={modalRef}
					style={{
						width: 400,
						height: 540,
						position: 'relative',
						background: 'white',
						borderRadius: 18,
						border: '2px #D9D9D9 solid',
						boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
						zIndex: 1001,
						transition: 'transform 200ms cubic-bezier(.4,2,.6,1), opacity 200ms',
						transform: animateIn ? 'scale(1)' : 'scale(0.98)',
						opacity: animateIn ? 1 : 0,
					}}
				>
					<button onClick={onClose} style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', zIndex: 2 }}>×</button>
					<div style={{width: 110, height: 110, left: 32, top: 32, position: 'absolute', background: '#D9D9D9', borderRadius: 9999, overflow: 'hidden'}}>
						<img style={{width: 110, height: 110, objectFit: 'cover'}} src="/employee.png" alt="profile" />
					</div>
					<div style={{left: 160, top: 40, position: 'absolute', color: 'black', fontSize: 22, fontFamily: 'Montserrat', fontWeight: 600, lineHeight: '22px', wordWrap: 'break-word'}}>
						{employee.first_name} {employee.last_name}
					</div>
					<div style={{left: 162, top: 75, position: 'absolute', color: 'black', fontSize: 15, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '15px', wordWrap: 'break-word'}}>
						{employee.department}
					</div>
					<div style={{left: 162, top: 100, position: 'absolute', color: 'black', fontSize: 13, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '18px', wordWrap: 'break-word'}}>
						{employee.level || 'Senior level'}<br/>Joined {employee.hire_date}
					</div>
							{/* More whitespace above Current Trainings */}
							<div style={{left: 36, top: 175, position: 'absolute', color: 'black', fontSize: 13, fontFamily: 'Montserrat', fontWeight: 500, lineHeight: '18px', wordWrap: 'break-word'}}>Current Trainings</div>
							<div style={{left: 36, top: 200, position: 'absolute', color: 'black', fontSize: 13, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '18px', wordWrap: 'break-word'}}>
								{trainings.join(', ')}
							</div>
									{/* Top Skills above details */}
									<div style={{left: 36, top: 240, position: 'absolute', color: 'black', fontSize: 13, fontFamily: 'Montserrat', fontWeight: 500, lineHeight: '18px', wordWrap: 'break-word'}}>Top Skills</div>
											<div style={{left: 36, top: 265, position: 'absolute', color: 'black', fontSize: 12, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '18px', wordWrap: 'break-word', whiteSpace: 'pre-line'}}>
												{topSkills.map(skill => `${skill.name}: ${skill.rating}/5`).join('\n')}
											</div>
											{/* Add more space between Top Skills and Details */}
											<div style={{width: 320, height: 110, left: 36, top: 335, position: 'absolute', color: 'black', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 500, lineHeight: '15px', wordWrap: 'break-word', overflow: 'auto'}}>
												{bio}
											</div>
							<div
								style={{width: 80, height: 28, left: 290, top: 480, position: 'absolute', background: '#D9D9D9', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
								onClick={() => {
									if (employee) {
										const empId = (employee as any).id ?? employee.employee_id;
										router.push(`/employee-details?id=${empId}`);
									}
								}}
							>
								<div style={{textAlign: 'center', color: 'black', fontSize: 15, fontFamily: 'Montserrat', fontWeight: 500, lineHeight: '22px', width: '100%'}}>Details</div>
							</div>
				</div>
			</div>
		);
};

export default EmployeeCardOverlay;
